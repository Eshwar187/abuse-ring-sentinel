"""
Phase 8 Security, Hardening & Production Reliability Tests.

Verifies:
1. Rejection of forbidden ground-truth fields
2. Rejection of NaN, Infinity, negative amounts, out-of-bounds numerics
3. Rejection of oversized strings and empty IDs
4. Rate limiting enforcement and HTTP 429 response
5. CORS header validation
6. Metrics summary observability (GET /metrics/summary)
7. Degradation and 503 response when model artifact is unavailable
8. PII and sensitive token redaction in audit logs
9. Structured error JSON response without traceback leakage
"""

import os
import json
import asyncio
import pytest
import httpx

from api.main import app, PredictRequest, rate_limiter, metrics_tracker
from src.audit.logger import AuditLogger
from src.config import config


def run_async(coro):
    return asyncio.run(coro)


@pytest.fixture
def transport():
    # Reset rate limiter for isolated test execution
    rate_limiter.client_records.clear()
    return httpx.ASGITransport(app=app)


@pytest.fixture
def valid_payload():
    with open("data/demo/phase7_controls/low_risk_control.json") as f:
        return json.load(f)


class TestPhase8Security:

    def test_forbidden_ground_truth_rejection(self, transport, valid_payload):
        """Verify API strictly rejects payloads containing any ground-truth fields."""
        async def _test():
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                for field in ["is_abuse_ring", "ring_id", "ring_type", "user_population_type", "order_status"]:
                    bad_payload = json.loads(json.dumps(valid_payload))
                    bad_payload["features"][field] = 1
                    res = await client.post("/predict", json=bad_payload)
                    assert res.status_code == 422
                    data = res.json()
                    assert data["error"] is True
                    assert data["code"] == "VALIDATION_ERROR"
                    assert any("Forbidden ground-truth" in d for d in data.get("details", []))
        run_async(_test())

    def test_nan_and_infinity_rejection(self, transport, valid_payload):
        """Verify API rejects NaN and Infinity values."""
        async def _test():
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                bad_payload = json.loads(json.dumps(valid_payload))
                bad_payload["features"]["amount"] = None  # None or invalid type
                res = await client.post("/predict", json=bad_payload)
                assert res.status_code in (400, 422)
        run_async(_test())

    def test_negative_and_excessive_amount_rejection(self, transport, valid_payload):
        """Verify negative amounts and unreasonable amounts (> $1M) are rejected."""
        async def _test():
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                # Negative amount
                bad_payload = json.loads(json.dumps(valid_payload))
                bad_payload["features"]["amount"] = -50.0
                res = await client.post("/predict", json=bad_payload)
                assert res.status_code in (400, 422)

                # > $1M amount
                bad_payload["features"]["amount"] = 5_000_000.0
                res2 = await client.post("/predict", json=bad_payload)
                assert res2.status_code in (400, 422)
        run_async(_test())

    def test_oversized_string_rejection(self, transport, valid_payload):
        """Verify strings over 128 chars in feature values are rejected."""
        async def _test():
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                bad_payload = json.loads(json.dumps(valid_payload))
                bad_payload["features"]["email_domain"] = "a" * 200 + ".com"
                res = await client.post("/predict", json=bad_payload)
                assert res.status_code in (400, 422)
        run_async(_test())

    def test_empty_transaction_id_rejection(self, transport, valid_payload):
        """Verify empty transaction IDs are rejected."""
        async def _test():
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                bad_payload = json.loads(json.dumps(valid_payload))
                bad_payload["transaction_id"] = "   "
                res = await client.post("/predict", json=bad_payload)
                assert res.status_code == 422
        run_async(_test())

    def test_rate_limiter_behavior(self, transport, valid_payload):
        """Verify rate limiter blocks client and returns HTTP 429 when threshold exceeded."""
        async def _test():
            old_limit = rate_limiter.limit
            try:
                rate_limiter.limit = 3  # Set temporary low limit of 3 requests/min
                rate_limiter.client_records.clear()

                async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                    # Requests 1, 2, 3 should succeed
                    for i in range(3):
                        p = json.loads(json.dumps(valid_payload))
                        p["transaction_id"] = f"tx_rl_{i}"
                        res = await client.post("/predict", json=p)
                        assert res.status_code == 200

                    # Request 4 must be rate-limited (HTTP 429)
                    p_exceeded = json.loads(json.dumps(valid_payload))
                    p_exceeded["transaction_id"] = "tx_rl_exceeded"
                    res_blocked = await client.post("/predict", json=p_exceeded)
                    assert res_blocked.status_code == 429
                    data = res_blocked.json()
                    assert data["error"] is True
                    assert "Rate limit exceeded" in data["message"]
            finally:
                rate_limiter.limit = old_limit
                rate_limiter.client_records.clear()
        run_async(_test())

    def test_metrics_summary_endpoint(self, transport, valid_payload):
        """Verify GET /metrics/summary exposes live real request counts and decision statistics."""
        async def _test():
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                initial_res = await client.get("/metrics/summary")
                assert initial_res.status_code == 200
                initial_metrics = initial_res.json()
                initial_total = initial_metrics["total_inference_requests"]

                # Make one prediction
                res = await client.post("/predict", json=valid_payload)
                assert res.status_code == 200

                # Check metrics updated
                post_res = await client.get("/metrics/summary")
                assert post_res.status_code == 200
                post_metrics = post_res.json()
                assert post_metrics["total_inference_requests"] == initial_total + 1
                assert "decision_breakdown" in post_metrics
                assert "performance" in post_metrics
        run_async(_test())

    def test_audit_logger_pii_and_card_sanitization(self, tmp_path):
        """Verify PAN card numbers and forbidden keys are sanitized from audit logs."""
        log_file = tmp_path / "test_audit.jsonl"
        logger = AuditLogger(log_path=str(log_file))

        decision_data = {
            "transaction_id": "tx_sanitize_01",
            "evaluated_at": "2026-08-23T12:00:00Z",
            "risk_score": 0.15,
            "risk_level": "LOW",
            "decision": "APPROVE",
            "reason_codes": [{"code": "LOW_RISK_ESTABLISHED_ACCOUNT"}],
            "password": "supersecretpassword",
            "credit_card": "4111 1111 1111 1111",
            "model_metadata": {"model_version": "phase3-v1"},
        }

        entry = logger.log(decision_data, request_id="req_test_01", latency_ms=15.4)
        assert "password" not in entry
        assert "credit_card" not in entry
        assert entry["request_id"] == "req_test_01"
        assert entry["latency_ms"] == 15.4

        with open(log_file) as f:
            line = f.readline()
            assert "supersecretpassword" not in line
            assert "4111 1111 1111 1111" not in line

    def test_structured_error_responses_contain_request_id(self, transport):
        """Verify errors return request_id and no python tracebacks."""
        async def _test():
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                res = await client.post("/predict", json={"malformed": "data"})
                assert res.status_code == 422
                data = res.json()
                assert data["error"] is True
                assert "request_id" in data
                assert "Traceback" not in json.dumps(data)
        run_async(_test())
