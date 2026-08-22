"""
Inference Monitoring and Batch Summary.

Calculates operational distribution metrics for production-style inference batches.
Ground-truth performance metrics (accuracy, recall) are NOT computed here because
ground truth is unavailable during live production scoring.
"""

from __future__ import annotations
from typing import Dict, Any, List
from dataclasses import dataclass
import pandas as pd
import numpy as np


@dataclass
class BatchMonitoringSummary:
    """Operational summary metrics of a batch of risk evaluations."""
    total_transactions: int
    approve_count: int
    approve_pct: float
    review_count: int
    review_pct: float
    block_count: int
    block_pct: float
    mean_risk_score: float
    median_risk_score: float
    p95_risk_score: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_transactions": self.total_transactions,
            "approve_count": self.approve_count,
            "approve_pct": round(self.approve_pct, 2),
            "review_count": self.review_count,
            "review_pct": round(self.review_pct, 2),
            "block_count": self.block_count,
            "block_pct": round(self.block_pct, 2),
            "mean_risk_score": round(self.mean_risk_score, 4),
            "median_risk_score": round(self.median_risk_score, 4),
            "p95_risk_score": round(self.p95_risk_score, 4),
        }


def summarize_prediction_batch(predictions_df: pd.DataFrame) -> BatchMonitoringSummary:
    """
    Summarizes operational distribution of scores and decisions from predictions DataFrame.
    """
    total = len(predictions_df)
    if total == 0:
        return BatchMonitoringSummary(
            total_transactions=0,
            approve_count=0,
            approve_pct=0.0,
            review_count=0,
            review_pct=0.0,
            block_count=0,
            block_pct=0.0,
            mean_risk_score=0.0,
            median_risk_score=0.0,
            p95_risk_score=0.0,
        )

    decisions = predictions_df["decision"].value_counts().to_dict()
    scores = predictions_df["risk_score"].values

    app_count = decisions.get("APPROVE", 0)
    rev_count = decisions.get("REVIEW", 0)
    blk_count = decisions.get("BLOCK", 0)

    summary = BatchMonitoringSummary(
        total_transactions=total,
        approve_count=app_count,
        approve_pct=(app_count / total) * 100.0,
        review_count=rev_count,
        review_pct=(rev_count / total) * 100.0,
        block_count=blk_count,
        block_pct=(blk_count / total) * 100.0,
        mean_risk_score=float(np.mean(scores)),
        median_risk_score=float(np.median(scores)),
        p95_risk_score=float(np.percentile(scores, 95)),
    )
    return summary
