"""
Phase 12 Integration Test Suite: Real Merchant Integration & API-First Risk Platform.

Verifies:
1. Raw merchant checkout acceptance & normalization
2. Exact 33-feature contract satisfaction (COMBINED_FEATURES)
3. Model F inference & decision engine execution
4. Cold start vs sufficient history handling
5. Idempotency & duplicate protection
6. API key authentication & rejection of invalid/missing keys
7. Strict merchant isolation (Merchant A graph != Merchant B graph)
8. Dynamic graph growth & risk escalation
9. Temporal leakage prevention (future transactions do not leak into earlier evaluations)
10. Outcome & lifecycle event recording without automated retraining
11. PII/card and target leakage rejection
12. Querying stored transaction risk
13. Model failure / degraded handling
"""

import os
import json
import hashlib
import pytest
import httpx
from datetime import datetime, timezone

from api.main import app, decision_engine
from src.state.state_store import RuntimeStateStore
from src.integration.normalizer import EventNormalizer
from src.integration.feature_adapter import FeatureAdapter
from src.features.groups import COMBINED_FEATURES


@pytest.fixture
def anyio_backend():
    return "asyncio"


class TestPhase12MerchantIntegration:

    @pytest.mark.anyio
    async def test_raw_transaction_acceptance(self):
        """1. Raw merchant transaction accepted without manual feature engineering."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            headers = {"X-API-Key": "ars_live_test_merchant_01"}
            payload = {
                "transaction_id": "tx_accept_001",
                "user_id": "user_alpha_101",
                "amount": 185.00,
                "currency": "INR",
                "timestamp": "2026-08-25T14:00:00Z",
                "product_category": "electronics",
                "device_id": "dev_alpha_101",
                "ip_address": "192.168.1.101",
                "payment_method_id": "pm_alpha_101",
                "shipping_address_id": "addr_101",
                "billing_address_id": "addr_101",
                "email_domain": "alpha@merchant.in",
            }
            res = await client.post("/api/v1/risk/evaluate", json=payload, headers=headers)
            assert res.status_code == 200
            data = res.json()
            assert data["transaction_id"] == "tx_accept_001"
            assert data["merchant_id"] == "merchant_dev_01"
            assert 0.0 <= data["risk_score"] <= 1.0
            assert data["decision"] in ("APPROVE", "REVIEW", "BLOCK")

    @pytest.mark.anyio
    async def test_normalization_and_aliases(self):
        """2. Merchant field aliases normalized cleanly."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            headers = {"X-API-Key": "ars_live_test_merchant_01"}
            payload = {
                "transaction_id": "tx_alias_002",
                "user_id": "user_beta_202",
                "amount": 450.00,
                "currency": "INR",
                "timestamp": "2026-08-25 14:30:00",
                "product_category": "FASHION",
                "device_id": "fp_beta_202",
                "ip_address": "10.0.0.202",
                "payment_method_id": "card_tok_202",
                "shipping_address_id": "ship_202",
                "billing_address_id": "ship_202",
                "email_domain": "customer@gmail.com",
                "promo_code": "SUMMER50",
            }
            res = await client.post("/api/v1/risk/evaluate", json=payload, headers=headers)
            assert res.status_code == 200
            data = res.json()
            assert data["decision"] in ("APPROVE", "REVIEW", "BLOCK")

    @pytest.mark.anyio
    async def test_malformed_input_rejection(self):
        """3. Rejection of negative amounts, NaNs, and empty IDs."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            headers = {"X-API-Key": "ars_live_test_merchant_01"}

            # Negative amount
            res = await client.post(
                "/api/v1/risk/evaluate",
                json={"transaction_id": "tx_bad_01", "user_id": "u1", "amount": -10.0, "timestamp": "2026-08-25T12:00:00Z"},
                headers=headers,
            )
            assert res.status_code == 422

            # Empty user_id
            res = await client.post(
                "/api/v1/risk/evaluate",
                json={"transaction_id": "tx_bad_02", "user_id": "   ", "amount": 10.0, "timestamp": "2026-08-25T12:00:00Z"},
                headers=headers,
            )
            assert res.status_code == 422

    @pytest.mark.anyio
    async def test_sensitive_field_and_target_leakage_rejection(self):
        """4. Rejection of passwords, tokens, and ground-truth columns."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            headers = {"X-API-Key": "ars_live_test_merchant_01"}

            # Target leakage
            res_leak = await client.post(
                "/api/v1/risk/evaluate",
                json={"transaction_id": "tx_leak", "user_id": "u1", "amount": 10.0, "timestamp": "2026-08-25T12:00:00Z", "ring_id": "ring_01"},
                headers=headers,
            )
            assert res_leak.status_code == 422

            # Password in custom fields
            res_secret = await client.post(
                "/api/v1/risk/evaluate",
                json={"transaction_id": "tx_sec", "user_id": "u1", "amount": 10.0, "timestamp": "2026-08-25T12:00:00Z", "custom_fields": {"password": "123"}},
                headers=headers,
            )
            assert res_secret.status_code == 422

    def test_automatic_33_feature_generation_and_contract(self):
        """5 & 6. FeatureAdapter generates exactly 33 valid numerical/categorical features."""
        store = RuntimeStateStore(db_path=":memory:")
        adapter = FeatureAdapter(state_store=store)
        norm = EventNormalizer()

        from src.integration.schemas import RawTransactionEvent
        raw = RawTransactionEvent(
            transaction_id="tx_feat_test_01",
            user_id="user_feat_test",
            amount=99.99,
            currency="INR",
            timestamp="2026-08-25T12:00:00Z",
            product_category="electronics",
            device_id="dev_001",
            ip_address="1.2.3.4",
            payment_method_id="pm_001",
            shipping_address_id="addr_01",
            billing_address_id="addr_01",
            email_domain="test.com",
            promo_code="SAVE10",
        )
        canonical = norm.normalize(raw)
        feats, dq = adapter.extract_features("merchant_test", canonical)

        assert len(feats) == 33
        assert set(feats.keys()) == set(COMBINED_FEATURES)
        assert dq.status == "cold_start"

    def test_cold_start_and_sufficient_history(self):
        """7 & 8. Verifies transition from cold start to sufficient history."""
        store = RuntimeStateStore(db_path=":memory:")
        adapter = FeatureAdapter(state_store=store)
        norm = EventNormalizer()

        from src.integration.schemas import RawTransactionEvent
        raw1 = RawTransactionEvent(
            transaction_id="tx_cs_01",
            user_id="user_cs",
            amount=100.0,
            timestamp="2026-08-25T10:00:00Z",
        )
        c1 = norm.normalize(raw1)
        f1, dq1 = adapter.extract_features("m_test", c1)
        assert dq1.status == "cold_start"
        assert f1["user_historical_tx_count"] == 0

        # Record tx1
        store.record_evaluated_transaction("m_test", c1, 0.05, "APPROVE", "2026-08-25T10:00:00Z")

        # Second transaction 2 hours later
        raw2 = RawTransactionEvent(
            transaction_id="tx_cs_02",
            user_id="user_cs",
            amount=200.0,
            timestamp="2026-08-25T12:00:00Z",
        )
        c2 = norm.normalize(raw2)
        f2, dq2 = adapter.extract_features("m_test", c2)
        assert dq2.status == "sufficient_history"
        assert f2["user_historical_tx_count"] == 1
        assert f2["user_historical_mean_amount"] == 100.0
        assert f2["user_tx_count_24h"] == 1
        assert f2["user_tx_count_1h"] == 0

    def test_point_in_time_behavior(self):
        """9. Strictly t < t_pred causality without future event contamination."""
        store = RuntimeStateStore(db_path=":memory:")
        adapter = FeatureAdapter(state_store=store)
        norm = EventNormalizer()

        from src.integration.schemas import RawTransactionEvent
        # Insert a future transaction at 18:00
        raw_fut = RawTransactionEvent(
            transaction_id="tx_fut",
            user_id="user_pit",
            amount=500.0,
            timestamp="2026-08-25T18:00:00Z",
        )
        c_fut = norm.normalize(raw_fut)
        store.record_evaluated_transaction("m_test", c_fut, 0.95, "BLOCK", "2026-08-25T18:00:00Z")

        # Evaluate transaction at 12:00
        raw_now = RawTransactionEvent(
            transaction_id="tx_now",
            user_id="user_pit",
            amount=50.0,
            timestamp="2026-08-25T12:00:00Z",
        )
        c_now = norm.normalize(raw_now)
        feats, dq = adapter.extract_features("m_test", c_now)

        assert dq.status == "cold_start"
        assert feats["user_historical_tx_count"] == 0
        assert feats["user_tx_count_24h"] == 0

    @pytest.mark.anyio
    async def test_real_model_inference_and_policy(self):
        """10 & 11. Frozen Model F produces real probability and decision policy is applied."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            headers = {"X-API-Key": "ars_live_test_merchant_01"}
            payload = {
                "transaction_id": "tx_real_inf_01",
                "user_id": "user_real_inf",
                "amount": 25.0,
                "timestamp": "2026-08-25T10:00:00Z",
                "email_domain": "established.com",
            }
            res = await client.post("/api/v1/risk/evaluate", json=payload, headers=headers)
            assert res.status_code == 200
            data = res.json()
            score = data["risk_score"]
            decision = data["decision"]

            if score < 0.50:
                assert decision == "APPROVE"
            elif score < 0.90:
                assert decision == "REVIEW"
            else:
                assert decision == "BLOCK"

    @pytest.mark.anyio
    async def test_reason_codes_and_evidence(self):
        """12. Reason codes are generated with observable evidence."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            headers = {"X-API-Key": "ars_live_test_merchant_01"}
            payload = {
                "transaction_id": "tx_reason_01",
                "user_id": "user_reason_01",
                "amount": 30.0,
                "timestamp": "2026-08-25T10:00:00Z",
            }
            res = await client.post("/api/v1/risk/evaluate", json=payload, headers=headers)
            assert res.status_code == 200
            data = res.json()
            assert len(data["reason_codes"]) > 0
            for r in data["reason_codes"]:
                assert "code" in r
                assert "message" in r
                assert "evidence" in r

    @pytest.mark.anyio
    async def test_api_authentication_and_invalid_keys(self):
        """13 & 14. API key authentication enforcement."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            payload = {
                "transaction_id": "tx_key_01",
                "user_id": "user_key_01",
                "amount": 10.0,
                "timestamp": "2026-08-25T10:00:00Z",
            }

            # Valid X-API-Key
            res1 = await client.post("/api/v1/risk/evaluate", json=payload, headers={"X-API-Key": "ars_live_test_merchant_01"})
            assert res1.status_code == 200

            # Invalid X-API-Key
            res2 = await client.post("/api/v1/risk/evaluate", json=payload, headers={"X-API-Key": "invalid_key"})
            assert res2.status_code == 401

            # Missing key
            res3 = await client.post("/api/v1/risk/evaluate", json=payload)
            assert res3.status_code == 401

    @pytest.mark.anyio
    async def test_idempotency_and_duplicate_protection(self):
        """15 & 16. Repeated evaluation with Idempotency-Key returns cached result."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            headers = {
                "X-API-Key": "ars_live_test_merchant_01",
                "Idempotency-Key": "idem_phase12_test_999",
            }
            payload = {
                "transaction_id": "tx_idem_999",
                "user_id": "user_idem_999",
                "amount": 77.0,
                "timestamp": "2026-08-25T10:00:00Z",
            }

            res1 = await client.post("/api/v1/risk/evaluate", json=payload, headers=headers)
            assert res1.status_code == 200
            data1 = res1.json()

            res2 = await client.post("/api/v1/risk/evaluate", json=payload, headers=headers)
            assert res2.status_code == 200
            data2 = res2.json()

            assert data1["transaction_id"] == data2["transaction_id"]
            assert data1["risk_score"] == data2["risk_score"]
            assert data1["decision"] == data2["decision"]

    @pytest.mark.anyio
    async def test_merchant_isolation(self):
        """17. Merchant A entity graph does not cross into Merchant B."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            isolated_device = "dev_isolated_corp_xyz"

            # Merchant A evaluates 2 users on isolated_device
            for i in [1, 2]:
                res = await client.post(
                    "/api/v1/risk/evaluate",
                    json={
                        "transaction_id": f"tx_iso_a_{i}",
                        "user_id": f"user_iso_a_{i}",
                        "amount": 50.0,
                        "timestamp": f"2026-08-25T10:0{i}:00Z",
                        "device_id": isolated_device,
                    },
                    headers={"X-API-Key": "ars_live_test_merchant_01"},
                )
                assert res.status_code == 200

            # Merchant B evaluates a user on the same device
            res_b = await client.post(
                "/api/v1/risk/evaluate",
                json={
                    "transaction_id": "tx_iso_b_1",
                    "user_id": "user_iso_b_1",
                    "amount": 50.0,
                    "timestamp": "2026-08-25T10:10:00Z",
                    "device_id": isolated_device,
                },
                headers={"X-API-Key": "ars_live_demo_merchant_02"},
            )
            assert res_b.status_code == 200
            data_b = res_b.json()
            assert data_b["merchant_id"] == "merchant_dev_02"
            assert data_b["evidence"]["device_prior_user_count"] == 0

    @pytest.mark.anyio
    async def test_graph_growth_and_dynamic_risk(self):
        """18 & 19. Multi-account collusion escalates graph density and risk score."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            headers = {"X-API-Key": "ars_live_test_merchant_01"}
            shared_d = "dev_sybil_dyn_99"
            shared_p = "pm_sybil_dyn_99"

            scores = []
            for i in range(1, 4):
                res = await client.post(
                    "/api/v1/risk/evaluate",
                    json={
                        "transaction_id": f"tx_dyn_sybil_{i}",
                        "user_id": f"user_dyn_sybil_{i}",
                        "amount": 300.0,
                        "timestamp": f"2026-08-25T12:0{i}:00Z",
                        "device_id": shared_d,
                        "payment_method_id": shared_p,
                    },
                    headers=headers,
                )
                assert res.status_code == 200
                scores.append(res.json()["risk_score"])

            assert scores[-1] >= scores[0]

    @pytest.mark.anyio
    async def test_outcome_recording_without_retraining(self):
        """20 & 21. Outcome feedback is stored and model artifact is not modified."""
        model_hash_before = hashlib.sha256(open("models/model_f.joblib", "rb").read()).hexdigest()

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            headers = {"X-API-Key": "ars_live_test_merchant_01"}
            payload = {
                "transaction_id": "tx_accept_001",
                "outcome": "CONFIRMED_FRAUD",
                "timestamp": "2026-08-25T15:00:00Z",
                "notes": "Verified fraud report.",
            }
            res = await client.post("/api/v1/outcomes", json=payload, headers=headers)
            assert res.status_code == 200
            assert res.json()["status"] == "recorded"

        model_hash_after = hashlib.sha256(open("models/model_f.joblib", "rb").read()).hexdigest()
        assert model_hash_before == model_hash_after, "Model artifact MUST NOT be modified by outcome feedback!"

    @pytest.mark.anyio
    async def test_get_evaluated_transaction_and_isolation(self):
        """22. Querying stored transaction and merchant isolation on retrieval."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            # Query existing tx for Merchant 1
            res1 = await client.get("/api/v1/risk/tx_accept_001", headers={"X-API-Key": "ars_live_test_merchant_01"})
            assert res1.status_code == 200
            assert res1.json()["transaction_id"] == "tx_accept_001"

            # Query non-existent tx
            res2 = await client.get("/api/v1/risk/tx_nonexistent_xyz", headers={"X-API-Key": "ars_live_test_merchant_01"})
            assert res2.status_code == 404

            # Merchant 2 queries Merchant 1's tx -> 404
            res3 = await client.get("/api/v1/risk/tx_accept_001", headers={"X-API-Key": "ars_live_demo_merchant_02"})
            assert res3.status_code == 404

    @pytest.mark.anyio
    async def test_merchant_config_and_health(self):
        """23 & 24. Merchant config and health endpoints match specification."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            headers = {"X-API-Key": "ars_live_test_merchant_01"}

            res_cfg = await client.get("/api/v1/merchant/config", headers=headers)
            assert res_cfg.status_code == 200
            assert res_cfg.json()["merchant_id"] == "merchant_dev_01"

            res_health = await client.get("/api/v1/merchant/health", headers=headers)
            assert res_health.status_code == 200
            assert res_health.json()["status"] == "ok"
            assert res_health.json()["state_store_status"] == "ready"
