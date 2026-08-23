"""
Production-Style Risk Decision Engine.

Coordinates:
1. Model Serving (probabilistic risk score generation)
2. Policy Evaluation (APPROVE / REVIEW / BLOCK)
3. Explainability & Reason Code Generation
4. Audit Data Structuring
"""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import pandas as pd

from src.serving.model_service import ModelServingService
from src.decision.policy import DecisionPolicy, RiskDecision, RiskLevel
from src.explanation.explainer import TransactionExplainer


class RiskDecisionEngine:
    """
    Main risk decision pipeline for real-time and batch merchant evaluation.
    """

    def __init__(
        self,
        model_service: Optional[ModelServingService] = None,
        policy: Optional[DecisionPolicy] = None,
        explainer: Optional[TransactionExplainer] = None,
        model_path: Optional[str] = None,
    ):
        if model_service is not None:
            self.model_service = model_service
        elif model_path is not None:
            self.model_service = ModelServingService(model_path=model_path)
        else:
            self.model_service = ModelServingService()
        self.policy = policy or DecisionPolicy()
        self.explainer = explainer or TransactionExplainer()

    def evaluate_features(self, features: Dict[str, Any], transaction_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Evaluates a pre-computed feature dictionary and produces a full risk decision.
        """
        tx_id = transaction_id or str(features.get("transaction_id", "tx_unknown"))

        # 1. Model Inference
        risk_score = self.model_service.predict_risk_score(features)

        # 2. Decision Policy Evaluation
        decision, risk_level = self.policy.evaluate(risk_score)

        # 3. Reason Codes and Feature Evidence
        reason_codes, evidence_summary = self.explainer.explain(features, risk_score, max_reasons=5)

        # 4. Assemble Structured Response
        result = {
            "transaction_id": tx_id,
            "risk_score": round(risk_score, 4),
            "risk_level": risk_level.value,
            "decision": decision.value,
            "reason_codes": reason_codes,
            "evidence": evidence_summary,
            "model_metadata": {
                "model_name": self.model_service.metadata["model_name"],
                "model_type": self.model_service.metadata["model_type"],
                "model_version": self.model_service.metadata["model_version"],
                "feature_version": self.model_service.metadata["feature_version"],
                "policy_version": self.policy.policy_version,
                "review_threshold": self.policy.review_threshold,
                "block_threshold": self.policy.block_threshold,
            },
            "evaluated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        return result
