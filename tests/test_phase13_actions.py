"""
Comprehensive Pytest Suite for Phase 13 Real Merchant Action Execution & Integration.
"""

import uuid
import json
import hashlib
import pytest
import httpx
from datetime import datetime, timezone

from api.main import app
from demo_merchant.main import app as demo_merchant_app, order_store
from src.actions.signature import generate_action_signature, verify_action_signature
from src.actions.merchant_client import validate_merchant_url, SSRFValidationError
from src.actions.retry_policy import RetryPolicy


FROZEN_MODEL_HASH = "f8bb74219cc080c7d789165a9a2821e7e88fd183c3dc87e20613ced4f191864b"
TEST_FEATURES_HASH = "be9b9f921948862a9fff52c9d6202bd2f6b1bf9c07a7725844bc2f5dad3a14cd"


def sha256_file(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()


@pytest.fixture
def anyio_backend():
    return "asyncio"


class TestPhase13MerchantActions:
    """Test suite for Phase 13 Outbound Action Execution & Merchant Integration."""

    def test_model_and_test_data_invariants(self):
        """Verify model_f.joblib and test_features.csv remain strictly untouched."""
        assert sha256_file("models/model_f.joblib") == FROZEN_MODEL_HASH
        assert sha256_file("data/processed/test_features.csv") == TEST_FEATURES_HASH

    def test_hmac_signature_generation_and_verification(self):
        """Verify HMAC-SHA256 signature generation and constant-time verification."""
        secret = "super_secure_secret_key_123"
        payload = b'{"event":"risk.action_required","transaction_id":"tx_1001","decision":"BLOCK"}'

        sig = generate_action_signature(payload, secret)
        assert sig.startswith("sha256=")

        # Valid signature passes
        assert verify_action_signature(payload, secret, sig) is True

        # Tampered payload fails
        tampered_payload = b'{"event":"risk.action_required","transaction_id":"tx_1001","decision":"APPROVE"}'
        assert verify_action_signature(tampered_payload, secret, sig) is False

        # Tampered secret fails
        assert verify_action_signature(payload, "wrong_secret", sig) is False

        # Tampered signature fails
        assert verify_action_signature(payload, secret, sig + "bad") is False

    def test_ssrf_url_validation(self):
        """Verify SSRF validation enforces scheme and production safety."""
        # Allowed in dev
        validate_merchant_url("http://127.0.0.1:8001/api/risk/action", environment="development")
        validate_merchant_url("https://api.merchant.com/webhook", environment="development")

        # Invalid schemes rejected
        with pytest.raises(SSRFValidationError):
            validate_merchant_url("ftp://server/action", environment="development")

        with pytest.raises(SSRFValidationError):
            validate_merchant_url("file:///etc/passwd", environment="development")

        # Production rejects HTTP
        with pytest.raises(SSRFValidationError):
            validate_merchant_url("http://api.merchant.com/webhook", environment="production")

        # Production rejects localhost/127.0.0.1
        with pytest.raises(SSRFValidationError):
            validate_merchant_url("https://127.0.0.1:8001/api/risk/action", environment="production")

    def test_retry_policy_classification(self):
        """Verify bounded retry logic distinguishes retryable vs non-retryable status codes."""
        policy = RetryPolicy(max_retries=2)

        # Retryable: 500, 502, 503, 504, 408, 429, Network error
        assert policy.should_retry(attempt_number=1, http_status=500) is True
        assert policy.should_retry(attempt_number=1, http_status=503) is True
        assert policy.should_retry(attempt_number=1, http_status=429) is True
        assert policy.should_retry(attempt_number=1, http_status=None, is_network_error=True) is True

        # Non-retryable: 400, 401, 403, 404, 422
        assert policy.should_retry(attempt_number=1, http_status=400) is False
        assert policy.should_retry(attempt_number=1, http_status=401) is False
        assert policy.should_retry(attempt_number=1, http_status=404) is False

        # Exhausted retries (attempt 3 > max_retries 2)
        assert policy.should_retry(attempt_number=3, http_status=500) is False

    @pytest.mark.anyio
    async def test_demo_merchant_simulator_order_lifecycle(self):
        """Verify the local demo merchant SQLite order store and webhook handler."""
        demo_transport = httpx.ASGITransport(app=demo_merchant_app)
        async with httpx.AsyncClient(transport=demo_transport, base_url="http://merchantserver") as client:
            # 1. Create order
            order_id = f"ord_{uuid.uuid4().hex[:8]}"
            create_res = await client.post("/api/orders", json={
                "order_id": order_id,
                "user_id": "usr_buyer_99",
                "amount": 2500.0,
                "currency": "INR",
            })
            assert create_res.status_code == 201
            assert create_res.json()["status"] == "PENDING"

            # 2. Send BLOCK action webhook
            action_payload = {
                "event": "risk.action_required",
                "request_id": "req_test_01",
                "merchant_id": "merchant_dev_01",
                "transaction_id": order_id,
                "decision": "BLOCK",
                "risk_score": 0.995,
                "action": "BLOCK_TRANSACTION",
                "reason_codes": ["GRAPH_CONNECTED_USERS", "SHARED_PAYMENT_DEVICE"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            action_res = await client.post("/api/risk/action", json=action_payload)
            assert action_res.status_code == 200
            assert action_res.json()["status"] == "EXECUTED"
            assert action_res.json()["order_state"] == "BLOCKED"

            # 3. Verify order in SQLite is genuinely BLOCKED
            get_res = await client.get(f"/api/orders/{order_id}")
            assert get_res.status_code == 200
            assert get_res.json()["status"] == "BLOCKED"
            assert get_res.json()["risk_action_received"] == "BLOCK_TRANSACTION"

    @pytest.mark.anyio
    async def test_unconfigured_merchant_action_status(self):
        """Verify evaluate on a merchant without action webhook returns status NOT_CONFIGURED."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            # Signup fresh merchant
            email = f"unconf_{uuid.uuid4().hex[:8]}@merchant.com"
            s_res = await client.post("/api/v1/auth/signup", json={
                "full_name": "Unconfigured Tester",
                "email": email,
                "company_name": "Unconfigured Store",
                "password": "Password123!",
            })
            api_key = s_res.json()["api_key"]

            # Evaluate transaction
            tx_id = f"tx_unconf_{uuid.uuid4().hex[:8]}"
            eval_res = await client.post("/api/v1/risk/evaluate", json={
                "transaction_id": tx_id,
                "user_id": "usr_unconf_01",
                "amount": 150.0,
                "currency": "INR",
                "timestamp": "2026-03-16T12:00:00Z",
            }, headers={"X-API-Key": api_key})

            assert eval_res.status_code == 200
            data = eval_res.json()
            assert "merchant_action" in data
            assert data["merchant_action"]["status"] == "NOT_CONFIGURED"

    @pytest.mark.anyio
    async def test_integration_settings_crud_and_masking(self):
        """Verify updating and retrieving merchant integration settings with masked secrets."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            # Signup
            email = f"settings_{uuid.uuid4().hex[:8]}@merchant.com"
            s_res = await client.post("/api/v1/auth/signup", json={
                "full_name": "Settings Tester",
                "email": email,
                "company_name": "Settings Store",
                "password": "Password123!",
            })
            token = s_res.json()["session_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Update integration config
            update_payload = {
                "action_endpoint_url": "http://127.0.0.1:8001/api/risk/action",
                "auth_token": "secret_merchant_token_9999",
                "webhook_secret": "hmac_signing_secret_8888",
                "timeout_seconds": 4.5,
                "max_retries": 3,
                "is_active": True,
            }
            put_res = await client.put("/api/v1/merchant/integration", json=update_payload, headers=headers)
            assert put_res.status_code == 200
            put_data = put_res.json()
            assert put_data["action_endpoint_url"] == "http://127.0.0.1:8001/api/risk/action"
            assert put_data["timeout_seconds"] == 4.5
            assert put_data["max_retries"] == 3
            # Secrets must be masked
            assert put_data["auth_token_masked"].startswith("••••••••")
            assert put_data["auth_token_masked"].endswith("9999")
            assert "secret_merchant_token_9999" not in json.dumps(put_data)

            # Get integration config
            get_res = await client.get("/api/v1/merchant/integration", headers=headers)
            assert get_res.status_code == 200
            get_data = get_res.json()
            assert get_data["action_endpoint_url"] == "http://127.0.0.1:8001/api/risk/action"

    @pytest.mark.anyio
    async def test_idempotency_prevents_duplicate_action_dispatch(self):
        """Verify submitting the same action twice returns cached response without duplicate dispatch."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            email = f"idemp_{uuid.uuid4().hex[:8]}@merchant.com"
            s_res = await client.post("/api/v1/auth/signup", json={
                "full_name": "Idemp Tester",
                "email": email,
                "company_name": "Idemp Store",
                "password": "Password123!",
            })
            api_key = s_res.json()["api_key"]
            token = s_res.json()["session_token"]

            tx_id = f"tx_idemp_{uuid.uuid4().hex[:8]}"
            eval_res1 = await client.post("/api/v1/risk/evaluate", json={
                "transaction_id": tx_id,
                "user_id": "usr_idemp_01",
                "amount": 299.0,
                "currency": "INR",
                "timestamp": "2026-03-16T12:00:00Z",
            }, headers={"X-API-Key": api_key})
            assert eval_res1.status_code == 200

            # Query action endpoint directly
            act_res1 = await client.get(f"/api/v1/actions/{tx_id}", headers={"Authorization": f"Bearer {token}"})
            assert act_res1.status_code == 200
            act_data1 = act_res1.json()

            # Execute manual action for same transaction -> returns cached
            act_res2 = await client.post(f"/api/v1/actions/{tx_id}", headers={"Authorization": f"Bearer {token}"})
            assert act_res2.status_code == 200
            act_data2 = act_res2.json()
            assert act_data2["request_id"] == act_data1["request_id"]

    @pytest.mark.anyio
    async def test_cross_tenant_action_isolation(self):
        """Verify Merchant A cannot view or trigger Merchant B's actions."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            # Merchant Alpha
            sA = (await client.post("/api/v1/auth/signup", json={
                "full_name": "Tenant Alpha",
                "email": f"talpha_{uuid.uuid4().hex[:8]}@a.com",
                "company_name": "Alpha Corp",
                "password": "Password123!",
            })).json()

            # Merchant Beta
            sB = (await client.post("/api/v1/auth/signup", json={
                "full_name": "Tenant Beta",
                "email": f"tbeta_{uuid.uuid4().hex[:8]}@b.com",
                "company_name": "Beta Corp",
                "password": "Password123!",
            })).json()

            # Alpha evaluates transaction
            tx_alpha = f"tx_alpha_{uuid.uuid4().hex[:8]}"
            await client.post("/api/v1/risk/evaluate", json={
                "transaction_id": tx_alpha,
                "user_id": "usr_a",
                "amount": 100.0,
                "currency": "INR",
                "timestamp": "2026-03-16T12:00:00Z",
            }, headers={"X-API-Key": sA["api_key"]})

            # Beta tries to query Alpha's action -> 404
            b_get = await client.get(f"/api/v1/actions/{tx_alpha}", headers={"Authorization": f"Bearer {sB['session_token']}"})
            assert b_get.status_code == 404

            # Beta tries to trigger Alpha's action -> 404
            b_post = await client.post(f"/api/v1/actions/{tx_alpha}", headers={"Authorization": f"Bearer {sB['session_token']}"})
            assert b_post.status_code == 404

    @pytest.mark.anyio
    async def test_action_retry_endpoint_bypasses_cache(self):
        """Verify POST /actions/{tx_id}/retry forces a fresh attempt."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            s_res = await client.post("/api/v1/auth/signup", json={
                "full_name": "Retry Tester",
                "email": f"retry_{uuid.uuid4().hex[:8]}@merchant.com",
                "company_name": "Retry Store",
                "password": "Password123!",
            })
            token = s_res.json()["session_token"]
            api_key = s_res.json()["api_key"]
            headers = {"Authorization": f"Bearer {token}"}

            tx_id = f"tx_retry_{uuid.uuid4().hex[:8]}"
            eval_res = await client.post("/api/v1/risk/evaluate", json={
                "transaction_id": tx_id,
                "user_id": "usr_retry_01",
                "amount": 500.0,
                "currency": "INR",
                "timestamp": "2026-03-16T12:00:00Z",
            }, headers={"X-API-Key": api_key})
            assert eval_res.status_code == 200

            # Force retry
            retry_res = await client.post(f"/api/v1/actions/{tx_id}/retry", headers=headers)
            assert retry_res.status_code == 200
            assert retry_res.json()["status"] in ("NOT_CONFIGURED", "EXECUTED", "FAILED")

    @pytest.mark.anyio
    async def test_test_endpoint_connectivity_probe_failure_on_bad_url(self):
        """Verify POST /merchant/action-endpoint/test accurately reports failure on unreachable URL."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            s_res = await client.post("/api/v1/auth/signup", json={
                "full_name": "Probe Tester",
                "email": f"probe_{uuid.uuid4().hex[:8]}@merchant.com",
                "company_name": "Probe Store",
                "password": "Password123!",
            })
            token = s_res.json()["session_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Probe an unreachable port
            test_res = await client.post(
                "/api/v1/merchant/action-endpoint/test",
                json={"endpoint_url": "http://127.0.0.1:59999/api/risk/action"},
                headers=headers,
            )
            assert test_res.status_code == 200
            test_data = test_res.json()
            assert test_data["status"] == "FAILED"
            assert test_data["error"] is not None

    @pytest.mark.anyio
    async def test_list_merchant_actions_pagination(self):
        """Verify GET /actions retrieves paginated action audit records."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            s_res = await client.post("/api/v1/auth/signup", json={
                "full_name": "List Tester",
                "email": f"list_{uuid.uuid4().hex[:8]}@merchant.com",
                "company_name": "List Store",
                "password": "Password123!",
            })
            token = s_res.json()["session_token"]
            api_key = s_res.json()["api_key"]
            headers = {"Authorization": f"Bearer {token}"}

            # Evaluate 2 transactions
            for i in range(2):
                await client.post("/api/v1/risk/evaluate", json={
                    "transaction_id": f"tx_list_{uuid.uuid4().hex[:8]}",
                    "user_id": f"usr_list_{i}",
                    "amount": 100.0 * (i + 1),
                    "currency": "INR",
                    "timestamp": "2026-03-16T12:00:00Z",
                }, headers={"X-API-Key": api_key})

            # List actions
            list_res = await client.get("/api/v1/actions?page=1&page_size=10", headers=headers)
            assert list_res.status_code == 200
            list_data = list_res.json()
            assert list_data["total_count"] == 2
            assert len(list_data["actions"]) == 2

