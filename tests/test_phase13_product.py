"""
Phase 13 Product UX, Authentication, Merchant Onboarding & Live Data Separation Tests.
"""

import uuid
import hashlib
import json
import pytest
import httpx
from api.main import app


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


class TestPhase13Product:
    """Test suite for Phase 13 authentication, onboarding, live data separation, and tenant isolation."""

    def test_model_and_test_data_invariants(self):
        """Verify that model_f.joblib and test_features.csv remain completely untouched."""
        model_hash = sha256_file("models/model_f.joblib")
        assert model_hash == FROZEN_MODEL_HASH, f"Model hash mismatch! Expected {FROZEN_MODEL_HASH}, got {model_hash}"

        test_data_hash = sha256_file("data/processed/test_features.csv")
        assert test_data_hash == TEST_FEATURES_HASH, f"Test data hash mismatch! Expected {TEST_FEATURES_HASH}, got {test_data_hash}"

    @pytest.mark.anyio
    async def test_merchant_signup_success(self):
        """Verify merchant signup creates tenant, admin user, session token, and raw API key."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            unique_email = f"tenant_{uuid.uuid4().hex[:10]}@ecommerce.io"
            payload = {
                "full_name": "Alexander Vance",
                "email": unique_email,
                "company_name": "Vance Enterprises",
                "password": "SecurePassword123!",
            }
            res = await client.post("/api/v1/auth/signup", json=payload)
            assert res.status_code == 201
            data = res.json()
            assert "merchant_id" in data
            assert "user_id" in data
            assert "api_key" in data
            assert data["api_key"].startswith("ars_live_")
            assert "session_token" in data
            assert data["company_name"] == "Vance Enterprises"

    @pytest.mark.anyio
    async def test_merchant_signup_duplicate_email(self):
        """Verify signup with an already registered email returns 409 Conflict."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            payload = {
                "full_name": "Duplicate User",
                "email": "dev@apexretail.com",  # Default seeded user
                "company_name": "Apex Retail",
                "password": "Password123!",
            }
            res = await client.post("/api/v1/auth/signup", json=payload)
            assert res.status_code == 409
            data = res.json()
            assert data["code"] == "EMAIL_ALREADY_EXISTS" or data.get("detail", {}).get("code") == "EMAIL_ALREADY_EXISTS"

    @pytest.mark.anyio
    async def test_merchant_login_success(self):
        """Verify login with valid credentials returns session token and masked API key."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            payload = {
                "email": "dev@apexretail.com",
                "password": "Password123!",
            }
            res = await client.post("/api/v1/auth/login", json=payload)
            assert res.status_code == 200
            data = res.json()
            assert data["merchant_id"] == "merchant_dev_01"
            assert "session_token" in data
            assert "api_key_masked" in data

    @pytest.mark.anyio
    async def test_merchant_login_invalid_password(self):
        """Verify login with invalid password returns 401 Unauthorized."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            payload = {
                "email": "dev@apexretail.com",
                "password": "WrongPassword999!",
            }
            res = await client.post("/api/v1/auth/login", json=payload)
            assert res.status_code == 401
            data = res.json()
            assert data["code"] == "INVALID_CREDENTIALS" or data.get("detail", {}).get("code") == "INVALID_CREDENTIALS"

    @pytest.mark.anyio
    async def test_auth_me_session_resolution(self):
        """Verify GET /api/v1/auth/me resolves current session token accurately."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            # 1. Login to get token
            login_res = await client.post("/api/v1/auth/login", json={"email": "dev@apexretail.com", "password": "Password123!"})
            token = login_res.json()["session_token"]

            # 2. Query /auth/me
            me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert me_res.status_code == 200
            me_data = me_res.json()
            assert me_data["email"] == "dev@apexretail.com"
            assert me_data["merchant_id"] == "merchant_dev_01"

    @pytest.mark.anyio
    async def test_api_key_rotation_lifecycle(self):
        """Verify key rotation revokes old key, issues new key, and updates authentication."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            # 1. Create a fresh merchant
            email = f"rotate_test_{uuid.uuid4().hex[:10]}@store.in"
            signup_res = await client.post("/api/v1/auth/signup", json={
                "full_name": "Rotate Tester",
                "email": email,
                "company_name": "Rotate Store",
                "password": "Password123!",
            })
            assert signup_res.status_code == 201
            init_data = signup_res.json()
            old_api_key = init_data["api_key"]
            session_token = init_data["session_token"]

            # 2. Old key works initially
            test_tx = {
                "transaction_id": f"tx_rot_{uuid.uuid4().hex[:6]}",
                "user_id": "usr_rot_01",
                "amount": 100.0,
                "currency": "INR",
                "timestamp": "2026-03-16T10:00:00Z",
            }
            res1 = await client.post("/api/v1/risk/evaluate", json=test_tx, headers={"X-API-Key": old_api_key})
            assert res1.status_code == 200

            # 3. Rotate key via session token
            rot_res = await client.post("/api/v1/auth/rotate-key", headers={"Authorization": f"Bearer {session_token}"})
            assert rot_res.status_code == 200
            new_api_key = rot_res.json()["new_api_key"]
            assert new_api_key != old_api_key

            # 4. Old key is now rejected (401)
            test_tx2 = {
                "transaction_id": f"tx_rot_{uuid.uuid4().hex[:6]}",
                "user_id": "usr_rot_01",
                "amount": 120.0,
                "currency": "INR",
                "timestamp": "2026-03-16T10:05:00Z",
            }
            res_old = await client.post("/api/v1/risk/evaluate", json=test_tx2, headers={"X-API-Key": old_api_key})
            assert res_old.status_code == 401

            # 5. New key evaluates successfully (200)
            res_new = await client.post("/api/v1/risk/evaluate", json=test_tx2, headers={"X-API-Key": new_api_key})
            assert res_new.status_code == 200

    @pytest.mark.anyio
    async def test_new_merchant_zero_data_state(self):
        """Verify new merchant initializes with zero_data_state=True and 0 transactions."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            email = f"zero_test_{uuid.uuid4().hex[:10]}@empty.io"
            signup_res = await client.post("/api/v1/auth/signup", json={
                "full_name": "Zero Tester",
                "email": email,
                "company_name": "Empty Mart",
                "password": "Password123!",
            })
            assert signup_res.status_code == 201
            session_token = signup_res.json()["session_token"]

            metrics_res = await client.get("/api/v1/merchant/metrics", headers={"Authorization": f"Bearer {session_token}"})
            assert metrics_res.status_code == 200
            data = metrics_res.json()
            assert data["zero_data_state"] is True
            assert data["total_transactions"] == 0
            assert data["approvals"] == 0
            assert data["blocks"] == 0

            tx_res = await client.get("/api/v1/merchant/transactions", headers={"Authorization": f"Bearer {session_token}"})
            assert tx_res.status_code == 200
            assert tx_res.json()["zero_data_state"] is True
            assert len(tx_res.json()["transactions"]) == 0

    @pytest.mark.anyio
    async def test_live_evaluation_populates_merchant_transactions_and_metrics(self):
        """Verify evaluating a live transaction populates merchant transactions and updates metrics."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            email = f"live_pop_{uuid.uuid4().hex[:10]}@store.com"
            signup_res = await client.post("/api/v1/auth/signup", json={
                "full_name": "Pop Tester",
                "email": email,
                "company_name": "Pop Store",
                "password": "Password123!",
            })
            assert signup_res.status_code == 201
            api_key = signup_res.json()["api_key"]
            session_token = signup_res.json()["session_token"]

            # Evaluate 1 transaction
            tx_id = f"tx_pop_{uuid.uuid4().hex[:8]}"
            eval_res = await client.post("/api/v1/risk/evaluate", json={
                "transaction_id": tx_id,
                "user_id": "usr_pop_01",
                "amount": 499.00,
                "currency": "INR",
                "timestamp": "2026-03-16T11:00:00Z",
                "product_category": "electronics",
            }, headers={"X-API-Key": api_key})
            assert eval_res.status_code == 200

            # Query metrics
            metrics_res = await client.get("/api/v1/merchant/metrics", headers={"Authorization": f"Bearer {session_token}"})
            assert metrics_res.status_code == 200
            m_data = metrics_res.json()
            assert m_data["zero_data_state"] is False
            assert m_data["total_transactions"] == 1
            assert len(m_data["recent_transactions"]) == 1

            # Query transactions list
            tx_res = await client.get("/api/v1/merchant/transactions", headers={"Authorization": f"Bearer {session_token}"})
            assert tx_res.status_code == 200
            assert tx_res.json()["total_count"] == 1
            assert tx_res.json()["transactions"][0]["transaction_id"] == tx_id

    @pytest.mark.anyio
    async def test_cross_tenant_isolation_in_live_queries(self):
        """Verify Merchant A cannot view transactions evaluated by Merchant B."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            # Merchant A
            resA = await client.post("/api/v1/auth/signup", json={
                "full_name": "Merchant Alpha",
                "email": f"alpha_{uuid.uuid4().hex[:10]}@a.com",
                "company_name": "Alpha Corp",
                "password": "Password123!",
            })
            assert resA.status_code == 201
            sA = resA.json()

            # Merchant B
            resB = await client.post("/api/v1/auth/signup", json={
                "full_name": "Merchant Beta",
                "email": f"beta_{uuid.uuid4().hex[:10]}@b.com",
                "company_name": "Beta Corp",
                "password": "Password123!",
            })
            assert resB.status_code == 201
            sB = resB.json()

            # Alpha evaluates a transaction
            tx_alpha_id = f"tx_alpha_secret_{uuid.uuid4().hex[:6]}"
            await client.post("/api/v1/risk/evaluate", json={
                "transaction_id": tx_alpha_id,
                "user_id": "usr_alpha_01",
                "amount": 999.00,
                "currency": "INR",
                "timestamp": "2026-03-16T12:00:00Z",
            }, headers={"X-API-Key": sA["api_key"]})

            # Beta queries transactions
            beta_res = await client.get("/api/v1/merchant/transactions", headers={"Authorization": f"Bearer {sB['session_token']}"})
            beta_txs = beta_res.json()
            assert beta_txs["total_count"] == 0
            assert len(beta_txs["transactions"]) == 0

            # Beta queries Alpha's transaction directly -> 404
            direct_res = await client.get(f"/api/v1/risk/{tx_alpha_id}", headers={"Authorization": f"Bearer {sB['session_token']}"})
            assert direct_res.status_code == 404
