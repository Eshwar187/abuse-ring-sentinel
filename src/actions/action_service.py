"""
Merchant Action Execution Service.
Coordinates policy mapping, idempotency checks, outbound HTTP dispatch, and state tracking.
"""

from __future__ import annotations
import uuid
import json
import hashlib
import time
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from src.actions.schemas import (
    ActionType,
    ActionStatus,
    RiskActionRequest,
    MerchantActionResponse,
    MerchantIntegrationConfig,
    ActionTestResponse,
)
from src.actions.merchant_client import MerchantActionClient
from src.state.state_store import RuntimeStateStore


def map_decision_to_action(decision: str) -> ActionType:
    """Maps risk decision to action type."""
    d = decision.strip().upper()
    if d == "BLOCK":
        return ActionType.BLOCK_TRANSACTION
    elif d == "REVIEW":
        return ActionType.REVIEW_TRANSACTION
    return ActionType.APPROVE_TRANSACTION


def compute_action_id(merchant_id: str, transaction_id: str, action: str) -> str:
    """Computes deterministic idempotency ID for the action."""
    raw = f"{merchant_id}:{transaction_id}:{action}"
    return f"act_{hashlib.sha256(raw.encode('utf-8')).hexdigest()[:16]}"


class ActionExecutionService:
    """
    Core orchestrator for merchant outbound actions.
    """

    def __init__(self, state_store: RuntimeStateStore, environment: str = "development"):
        self.state_store = state_store
        self.client = MerchantActionClient(environment=environment)

    async def execute_action_for_evaluation(
        self,
        merchant_id: str,
        transaction_id: str,
        decision: str,
        risk_score: float,
        risk_level: str = "LOW",
        reason_codes: Optional[List[str]] = None,
        force_retry: bool = False,
    ) -> MerchantActionResponse:
        """
        Executes outbound merchant action following a risk evaluation.
        Enforces idempotency and records state in SQLite.
        """
        action_type = map_decision_to_action(decision)
        action_id = compute_action_id(merchant_id, transaction_id, action_type.value)
        req_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Check existing action record for idempotency
        if not force_retry:
            existing = self.state_store.get_action_by_id(action_id)
            if existing:
                return MerchantActionResponse(
                    request_id=existing["action_id"],
                    transaction_id=existing["transaction_id"],
                    action=ActionType(existing["action"]),
                    status=ActionStatus(existing["status"]),
                    merchant_reference=existing.get("merchant_reference"),
                    merchant_message=existing.get("merchant_message") or "Returned from idempotent cache",
                    http_status=existing.get("http_status"),
                    latency_ms=existing.get("latency_ms", 0.0),
                    attempt_number=existing.get("attempt_number", 1),
                    executed_at=existing.get("completed_at"),
                )

        # 2. Retrieve merchant integration configuration
        config_dict = self.state_store.get_merchant_integration(merchant_id, include_secrets=True)
        if not config_dict or not config_dict.get("is_active") or not config_dict.get("action_endpoint_url"):
            # Record unconfigured action
            unconf_res = MerchantActionResponse(
                request_id=action_id,
                transaction_id=transaction_id,
                action=action_type,
                status=ActionStatus.NOT_CONFIGURED,
                merchant_message="Merchant action webhook is not configured.",
                latency_ms=0.0,
            )
            self.state_store.record_action_attempt(
                action_id=action_id,
                merchant_id=merchant_id,
                transaction_id=transaction_id,
                decision=decision,
                action=action_type.value,
                attempt_number=1,
                status=ActionStatus.NOT_CONFIGURED.value,
                http_status=None,
                merchant_reference=None,
                merchant_message=unconf_res.merchant_message,
                latency_ms=0.0,
                payload_json=None,
                response_json=None,
                created_at=now_iso,
                completed_at=now_iso,
            )
            return unconf_res

        config = MerchantIntegrationConfig(**config_dict)

        # 3. Construct outbound request payload
        action_request = RiskActionRequest(
            request_id=req_id,
            merchant_id=merchant_id,
            transaction_id=transaction_id,
            decision=decision,
            risk_score=risk_score,
            risk_level=risk_level,
            action=action_type,
            reason_codes=reason_codes or [],
            timestamp=now_iso,
        )

        # 4. Dispatch outbound HTTP request via client
        response = await self.client.send_action_request(
            config=config,
            action_request=action_request,
            action_id=action_id,
        )

        # 5. Persist action attempt in SQLite
        completed_at = datetime.now(timezone.utc).isoformat() if response.status in (ActionStatus.EXECUTED, ActionStatus.FAILED, ActionStatus.TIMEOUT, ActionStatus.REJECTED) else None
        self.state_store.record_action_attempt(
            action_id=action_id,
            merchant_id=merchant_id,
            transaction_id=transaction_id,
            decision=decision,
            action=action_type.value,
            attempt_number=response.attempt_number,
            status=response.status.value,
            http_status=response.http_status,
            merchant_reference=response.merchant_reference,
            merchant_message=response.merchant_message,
            latency_ms=response.latency_ms,
            payload_json=json.dumps(action_request.model_dump()),
            response_json=json.dumps(response.model_dump()),
            created_at=now_iso,
            completed_at=completed_at,
        )

        return response

    async def test_merchant_connection(
        self,
        merchant_id: str,
        endpoint_url: Optional[str] = None,
        auth_token: Optional[str] = None,
        webhook_secret: Optional[str] = None,
    ) -> ActionTestResponse:
        """
        Performs an active HTTP ping test against the merchant's endpoint.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        req_id = f"test_{uuid.uuid4().hex[:8]}"

        # Resolve config from DB if not passed explicitly
        if not endpoint_url:
            saved_config = self.state_store.get_merchant_integration(merchant_id, include_secrets=True)
            if not saved_config or not saved_config.get("action_endpoint_url"):
                return ActionTestResponse(
                    status="FAILED",
                    http_status=None,
                    latency_ms=0.0,
                    endpoint_url="",
                    request_id=req_id,
                    timestamp=now_iso,
                    error="No endpoint URL provided or configured in settings.",
                )
            endpoint_url = saved_config["action_endpoint_url"]
            auth_token = auth_token or saved_config.get("auth_token")
            webhook_secret = webhook_secret or saved_config.get("webhook_secret")

        is_connected, http_status, latency_ms, snippet, error = await self.client.test_connectivity(
            endpoint_url=endpoint_url,
            auth_token=auth_token,
            webhook_secret=webhook_secret,
        )

        return ActionTestResponse(
            status="CONNECTED" if is_connected else "FAILED",
            http_status=http_status,
            latency_ms=latency_ms,
            endpoint_url=endpoint_url,
            request_id=req_id,
            timestamp=now_iso,
            response_body=snippet,
            error=error,
        )
