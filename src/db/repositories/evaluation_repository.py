"""
Evaluation Repository for MySQL persistence.
Persists risk scores, decisions, reason codes, and extracted feature vectors.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
import json
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from src.db.models import RiskEvaluationModel


class EvaluationRepository:
    def __init__(self, session: Session):
        self.session = session

    def save_evaluation(
        self,
        request_id: str,
        merchant_id: str,
        transaction_id: str,
        risk_score: float,
        risk_level: str,
        decision: str,
        reason_codes: List[Dict[str, Any]],
        evidence: Dict[str, Any],
        features: Dict[str, Any],
        model_version: str,
        latency_ms: float,
        data_quality_status: str,
        evaluated_at: datetime,
    ) -> RiskEvaluationModel:
        now = datetime.utcnow()
        eval_record = RiskEvaluationModel(
            request_id=request_id,
            merchant_id=merchant_id,
            transaction_id=transaction_id,
            risk_score=risk_score,
            risk_level=risk_level,
            decision=decision,
            reason_codes_json=json.dumps(reason_codes),
            evidence_json=json.dumps(evidence),
            features_json=json.dumps(features),
            model_version=model_version,
            latency_ms=latency_ms,
            data_quality_status=data_quality_status,
            evaluated_at=evaluated_at,
            created_at=now,
        )
        self.session.add(eval_record)
        return eval_record

    def get_evaluation(self, merchant_id: str, transaction_id: str) -> Optional[RiskEvaluationModel]:
        stmt = select(RiskEvaluationModel).where(
            RiskEvaluationModel.merchant_id == merchant_id,
            RiskEvaluationModel.transaction_id == transaction_id,
        )
        return self.session.scalar(stmt)

    def get_evaluation_by_request_id(self, merchant_id: str, request_id: str) -> Optional[RiskEvaluationModel]:
        stmt = select(RiskEvaluationModel).where(
            RiskEvaluationModel.merchant_id == merchant_id,
            RiskEvaluationModel.request_id == request_id,
        )
        return self.session.scalar(stmt)

    def get_merchant_metrics(self, merchant_id: str) -> Dict[str, Any]:
        """Calculates live aggregated KPI metrics from MySQL."""
        stmt = select(RiskEvaluationModel).where(RiskEvaluationModel.merchant_id == merchant_id)
        evals = list(self.session.scalars(stmt).all())
        total = len(evals)
        if total == 0:
            return {
                "total_transactions": 0,
                "approvals": 0,
                "reviews": 0,
                "blocks": 0,
                "approval_rate": 0.0,
                "review_rate": 0.0,
                "block_rate": 0.0,
                "average_risk_score": 0.0,
                "zero_data_state": True,
            }

        approvals = sum(1 for e in evals if e.decision == "APPROVE")
        reviews = sum(1 for e in evals if e.decision == "REVIEW")
        blocks = sum(1 for e in evals if e.decision == "BLOCK")
        avg_score = sum(e.risk_score for e in evals) / total

        return {
            "total_transactions": total,
            "approvals": approvals,
            "reviews": reviews,
            "blocks": blocks,
            "approval_rate": round(approvals / total, 4),
            "review_rate": round(reviews / total, 4),
            "block_rate": round(blocks / total, 4),
            "average_risk_score": round(avg_score, 4),
            "zero_data_state": False,
        }
