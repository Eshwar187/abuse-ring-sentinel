"""
Asynchronous Outbound HTTP Client for Merchant Action Execution.
"""

from __future__ import annotations
import time
import json
import logging
import ipaddress
from urllib.parse import urlparse
from typing import Dict, Any, Optional, Tuple
import httpx

from src.actions.schemas import (
    RiskActionRequest,
    MerchantActionResponse,
    ActionStatus,
    ActionType,
    MerchantIntegrationConfig,
)
from src.actions.signature import generate_action_signature
from src.actions.retry_policy import RetryPolicy


logger = logging.getLogger("sentinel.actions.client")


class SSRFValidationError(ValueError):
    pass


def validate_merchant_url(url: str, environment: str = "development") -> None:
    """
    Validates outbound webhook destination to prevent SSRF vulnerabilities.
    
    In production:
    - Enforces https:// scheme
    - Disallows private, loopback, and cloud-metadata addresses
    
    In development / test:
    - Allows http:// and https://
    - Permits localhost and 127.0.0.1 for local simulator testing
    """
    if not url:
        raise SSRFValidationError("Endpoint URL cannot be empty.")

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise SSRFValidationError(f"Invalid URL scheme '{parsed.scheme}'. Only 'http' and 'https' are supported.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFValidationError("Invalid URL: missing hostname.")

    if environment == "production":
        if parsed.scheme != "https":
            raise SSRFValidationError("Production merchant endpoints must strictly use HTTPS.")

        # Disallow loopback, private ranges, and AWS metadata in production
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                raise SSRFValidationError(f"Access to private/internal IP address '{hostname}' is prohibited in production.")
        except ValueError:
            # It's a hostname like example.com
            lower_host = hostname.lower()
            if lower_host in ("localhost", "127.0.0.1", "0.0.0.0", "metadata.google.internal"):
                raise SSRFValidationError(f"Access to hostname '{hostname}' is prohibited in production.")


class MerchantActionClient:
    """
    HTTP client responsible for dispatching signed action requests to merchant endpoints.
    """

    def __init__(self, environment: str = "development"):
        self.environment = environment

    async def send_action_request(
        self,
        config: MerchantIntegrationConfig,
        action_request: RiskActionRequest,
        action_id: str,
    ) -> MerchantActionResponse:
        """
        Dispatches an action request with signing, retries, and timing measurement.
        """
        if not config.action_endpoint_url:
            return MerchantActionResponse(
                request_id=action_request.request_id,
                transaction_id=action_request.transaction_id,
                action=action_request.action,
                status=ActionStatus.NOT_CONFIGURED,
                merchant_message="Merchant action endpoint URL is not configured.",
                latency_ms=0.0,
            )

        validate_merchant_url(config.action_endpoint_url, self.environment)

        payload_dict = action_request.model_dump()
        payload_json = json.dumps(payload_dict, separators=(",", ":"))
        payload_bytes = payload_json.encode("utf-8")

        headers = {
            "Content-Type": "application/json",
            "X-Abuse-Sentinel-Request-ID": action_request.request_id,
            "Idempotency-Key": action_id,
        }

        # Attach auth header if configured
        if config.auth_token:
            if config.auth_header_name.lower() == "authorization" and not config.auth_token.lower().startswith("bearer "):
                headers[config.auth_header_name] = f"Bearer {config.auth_token}"
            else:
                headers[config.auth_header_name] = config.auth_token

        # Attach HMAC-SHA256 signature if secret is configured
        if config.webhook_secret:
            signature = generate_action_signature(payload_bytes, config.webhook_secret)
            headers["X-Abuse-Sentinel-Signature"] = signature

        retry_policy = RetryPolicy(max_retries=config.max_retries)
        timeout = httpx.Timeout(config.timeout_seconds, connect=config.timeout_seconds)

        attempt = 1
        last_error = None
        last_status_code = None

        while True:
            t0 = time.perf_counter()
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(
                        config.action_endpoint_url,
                        content=payload_bytes,
                        headers=headers,
                    )
                    latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
                    last_status_code = resp.status_code

                    if resp.is_success:
                        # Parse merchant acknowledgement
                        resp_data = {}
                        try:
                            resp_data = resp.json()
                        except Exception:
                            resp_data = {"raw": resp.text[:200]}

                        raw_status = str(resp_data.get("status", "EXECUTED")).upper()
                        confirmed_status = ActionStatus.EXECUTED if raw_status == "EXECUTED" else ActionStatus.REJECTED

                        return MerchantActionResponse(
                            request_id=action_request.request_id,
                            transaction_id=action_request.transaction_id,
                            action=action_request.action,
                            status=confirmed_status,
                            merchant_reference=resp_data.get("merchant_reference") or resp_data.get("order_id"),
                            merchant_message=resp_data.get("merchant_message") or resp_data.get("message") or "Acknowledged by merchant",
                            http_status=resp.status_code,
                            latency_ms=latency_ms,
                            attempt_number=attempt,
                            executed_at=resp_data.get("executed_at"),
                        )

                    # Non-2xx response
                    if retry_policy.should_retry(attempt, resp.status_code, is_network_error=False):
                        logger.warning(f"Merchant HTTP {resp.status_code} on attempt {attempt}. Retrying...")
                        attempt += 1
                        await retry_policy.wait_backoff(attempt)
                        continue

                    # Non-retryable error (e.g. 400, 401, 403, 404, or retries exhausted)
                    return MerchantActionResponse(
                        request_id=action_request.request_id,
                        transaction_id=action_request.transaction_id,
                        action=action_request.action,
                        status=ActionStatus.FAILED,
                        merchant_message=f"Merchant endpoint returned HTTP {resp.status_code}",
                        http_status=resp.status_code,
                        latency_ms=latency_ms,
                        attempt_number=attempt,
                        error_detail=f"HTTP_{resp.status_code}: {resp.text[:200]}",
                    )

            except httpx.TimeoutException:
                latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
                if retry_policy.should_retry(attempt, 408, is_network_error=True):
                    attempt += 1
                    await retry_policy.wait_backoff(attempt)
                    continue

                return MerchantActionResponse(
                    request_id=action_request.request_id,
                    transaction_id=action_request.transaction_id,
                    action=action_request.action,
                    status=ActionStatus.TIMEOUT,
                    merchant_message=f"Merchant endpoint timed out after {config.timeout_seconds}s",
                    http_status=408,
                    latency_ms=latency_ms,
                    attempt_number=attempt,
                    error_detail="Request to merchant endpoint timed out.",
                )

            except httpx.RequestError as e:
                latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
                if retry_policy.should_retry(attempt, None, is_network_error=True):
                    attempt += 1
                    await retry_policy.wait_backoff(attempt)
                    continue

                # Redact any accidental credential leak from exception string
                err_msg = str(e)
                if config.auth_token and config.auth_token in err_msg:
                    err_msg = err_msg.replace(config.auth_token, "[REDACTED]")

                return MerchantActionResponse(
                    request_id=action_request.request_id,
                    transaction_id=action_request.transaction_id,
                    action=action_request.action,
                    status=ActionStatus.FAILED,
                    merchant_message=f"Network error connecting to merchant: {type(e).__name__}",
                    latency_ms=latency_ms,
                    attempt_number=attempt,
                    error_detail=err_msg[:200],
                )

    async def test_connectivity(
        self,
        endpoint_url: str,
        auth_token: Optional[str] = None,
        webhook_secret: Optional[str] = None,
        timeout_seconds: float = 3.0,
    ) -> Tuple[bool, Optional[int], float, str, Optional[str]]:
        """
        Sends an active probe ping to verify endpoint connectivity.
        
        Returns:
            (is_connected, http_status, latency_ms, response_body_snippet, error_message)
        """
        validate_merchant_url(endpoint_url, self.environment)

        ping_payload = {
            "event": "risk.ping",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "message": "Abuse-Ring Sentinel Integration Probe",
        }
        payload_bytes = json.dumps(ping_payload).encode("utf-8")

        headers = {
            "Content-Type": "application/json",
            "X-Abuse-Sentinel-Probe": "true",
        }

        if auth_token:
            if not auth_token.lower().startswith("bearer "):
                headers["Authorization"] = f"Bearer {auth_token}"
            else:
                headers["Authorization"] = auth_token

        if webhook_secret:
            headers["X-Abuse-Sentinel-Signature"] = generate_action_signature(payload_bytes, webhook_secret)

        t0 = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=timeout_seconds) as client:
                resp = await client.post(endpoint_url, content=payload_bytes, headers=headers)
                latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
                is_connected = resp.is_success
                body_snippet = resp.text[:200]
                error = None if is_connected else f"HTTP {resp.status_code}"
                return (is_connected, resp.status_code, latency_ms, body_snippet, error)
        except Exception as e:
            latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
            err_msg = str(e)
            if auth_token and auth_token in err_msg:
                err_msg = err_msg.replace(auth_token, "[REDACTED]")
            return (False, None, latency_ms, "", err_msg)
