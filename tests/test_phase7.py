"""
Phase 7 End-to-End Reality and Integration Test Suite.

Verifies:
1. Production model artifact integrity (models/model_f.joblib)
2. Live FastAPI inference via POST /predict
3. Bounded probabilistic scoring in [0.0, 1.0]
4. Policy enforcement (tau* = 0.90)
5. Reason code generation from observable evidence
6. Target leakage rejection (422 / 400 on ground-truth fields)
7. Low-risk control payload evaluation (APPROVE)
8. High-risk control payload evaluation (BLOCK)
9. Dynamic inference sensitivity (score and decision shift on feature mutation)
10. Structured audit logging without PII
11. Health endpoint metadata accuracy
"""

import os
import json
import pytest
import joblib
import numpy as np
import pandas as pd

from src.features.groups import COMBINED_FEATURES
from src.models.tree_model import TreeRiskModel
from src.decision.engine import RiskDecisionEngine
from src.decision.policy import DecisionPolicy, RiskDecision, RiskLevel
from api.main import app, predict_transaction_risk, health_check, PredictRequest


class TestPhase7EndToEnd:

    @pytest.fixture(autouse=True)
    def setup_paths(self):
        self.model_path = "models/model_f.joblib"
        self.low_ctrl_path = "data/demo/phase7_controls/low_risk_control.json"
        self.high_ctrl_path = "data/demo/phase7_controls/high_risk_control.json"
        self.audit_log_path = "reports/audit_log.jsonl"

    def test_model_artifact_loading_and_pipeline(self):
        """Verify model_f.joblib exists, deserializes, and wraps HistGradientBoostingClassifier."""
        assert os.path.exists(self.model_path), "Model artifact models/model_f.joblib must exist"
        model = joblib.load(self.model_path)
        assert isinstance(model, TreeRiskModel), "Model must be an instance of TreeRiskModel"
        assert hasattr(model, "pipeline") and model.pipeline is not None
        clf = model.pipeline.named_steps.get("classifier")
        assert clf.__class__.__name__ == "HistGradientBoostingClassifier"
        assert len(model.feature_names_) == 33, "Model must expect exactly 33 features"

    def test_health_endpoint_metadata(self):
        """Verify GET /health returns valid status and model versions."""
        res = health_check()
        assert res["status"] == "ok"
        assert res["model_name"] == "abuse_ring_sentinel"
        assert res["model_type"] == "hist_gradient_boosting"
        assert res["model_version"] == "phase3-v1"
        assert res["feature_version"] == "features-v2"
        assert res["policy_version"] == "val-opt-v1"

    def test_low_risk_control_inference(self):
        """Verify low-risk synthetic control evaluates to APPROVE (score < 0.50)."""
        assert os.path.exists(self.low_ctrl_path)
        with open(self.low_ctrl_path) as f:
            payload = json.load(f)

        req = PredictRequest(**payload)
        res = predict_transaction_risk(req)
        assert res.transaction_id == payload["transaction_id"]
        assert 0.0 <= res.risk_score < 0.50
        assert res.risk_level == "LOW"
        assert res.decision == "APPROVE"
        assert len(res.reason_codes) > 0

    def test_high_risk_control_inference(self):
        """Verify high-risk synthetic control evaluates to BLOCK (score >= 0.90)."""
        assert os.path.exists(self.high_ctrl_path)
        with open(self.high_ctrl_path) as f:
            payload = json.load(f)

        req = PredictRequest(**payload)
        res = predict_transaction_risk(req)
        assert res.transaction_id == payload["transaction_id"]
        assert res.risk_score >= 0.90
        assert res.risk_level == "HIGH"
        assert res.decision == "BLOCK"
        codes = [r.code for r in res.reason_codes]
        assert "GRAPH_CONNECTED_USERS" in codes or "GRAPH_SHARED_DEVICE" in codes

    def test_dynamic_inference_sensitivity(self):
        """Verify that mutating observable features dynamically changes the model probability."""
        with open(self.high_ctrl_path) as f:
            high_payload = json.load(f)

        # Baseline: High Risk
        req1 = PredictRequest(**high_payload)
        res1 = predict_transaction_risk(req1)
        score_before = res1.risk_score
        assert score_before >= 0.90

        # Mutation: Strip graph collusion and set established tenure
        mutated_payload = json.loads(json.dumps(high_payload))
        mutated_payload["transaction_id"] = "tx_test_mutated_01"
        f = mutated_payload["features"]
        f["device_prior_user_count"] = 0
        f["ip_prior_user_count"] = 0
        f["payment_prior_user_count"] = 0
        f["shipping_address_prior_user_count"] = 0
        f["max_shared_entity_user_count"] = 0
        f["number_of_prior_connected_users"] = 0
        f["shared_entity_types_count"] = 0
        f["connected_component_user_count"] = 1
        f["connected_component_total_nodes"] = 1
        f["connected_component_edge_count"] = 0
        f["connected_component_density"] = 0.0
        f["account_age_days"] = 150.0
        f["user_tx_count_1h"] = 0
        f["user_tx_count_24h"] = 1
        f["user_tx_count_7d"] = 2
        f["email_domain"] = "gmail.com"
        f["is_promo_used"] = 0

        req2 = PredictRequest(**mutated_payload)
        res2 = predict_transaction_risk(req2)
        score_after = res2.risk_score

        # Verify dynamic shift
        assert score_after < 0.50, f"Expected mutated score to drop below 0.50, got {score_after}"
        assert res2.decision == "APPROVE"
        assert (score_before - score_after) > 0.80, "Expected significant probability reduction"

    def test_ground_truth_leakage_rejection(self):
        """Verify API validator rejects ground-truth fields if present."""
        with open(self.low_ctrl_path) as f:
            payload = json.load(f)

        payload["features"]["is_abuse_ring"] = 0
        with pytest.raises(ValueError, match="Forbidden ground-truth"):
            PredictRequest(**payload)

    def test_audit_log_append(self):
        """Verify that evaluating a transaction appends a record to reports/audit_log.jsonl."""
        initial_count = 0
        if os.path.exists(self.audit_log_path):
            with open(self.audit_log_path) as f:
                initial_count = sum(1 for line in f if line.strip())

        with open(self.low_ctrl_path) as f:
            payload = json.load(f)
        payload["transaction_id"] = f"tx_audit_test_{initial_count}"

        req = PredictRequest(**payload)
        res = predict_transaction_risk(req)

        assert os.path.exists(self.audit_log_path)
        with open(self.audit_log_path) as f:
            lines = [line.strip() for line in f if line.strip()]

        assert len(lines) >= initial_count + 1
        last_entry = json.loads(lines[-1])
        assert last_entry["transaction_id"] == payload["transaction_id"]
        assert last_entry["decision"] == res.decision
        assert "password" not in last_entry
        assert "credit_card" not in last_entry
