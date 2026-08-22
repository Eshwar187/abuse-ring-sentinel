"""
Cost-Sensitive Loss and Merchant Risk Economics.

Calculates estimated business loss based on asymmetric costs of
False Positives (customer friction/churn) vs False Negatives (fraud loss).
"""

from __future__ import annotations
from typing import Dict, Any
from dataclasses import dataclass
import numpy as np


@dataclass
class CostMatrixConfig:
    """
    Illustrative cost parameters for threshold sensitivity analysis.
    Note: These are illustrative benchmark assumptions and not proprietary merchant costs.
    """
    fp_cost: float = 10.00      # Cost of blocking/insulting a good customer ($10)
    fn_cost: float = 50.00      # Cost of unstopped abuse transaction ($50 chargeback/loss)
    review_cost: float = 1.50   # Cost of 2FA/manual verification challenge ($1.50)


def compute_business_loss(
    fp_count: int,
    fn_count: int,
    tp_count: int,
    tn_count: int,
    config: Optional[CostMatrixConfig] = None
) -> Dict[str, Any]:
    """
    Computes total estimated financial loss for a confusion matrix outcome.
    """
    cfg = config or CostMatrixConfig()

    total_fp_loss = fp_count * cfg.fp_cost
    total_fn_loss = fn_count * cfg.fn_cost
    total_cost = total_fp_loss + total_fn_loss
    total_txs = fp_count + fn_count + tp_count + tn_count

    # Baseline: If merchant had no model and approved all transactions (FP=0, FN=Total Positives)
    actual_positives = tp_count + fn_count
    baseline_loss_approve_all = actual_positives * cfg.fn_cost

    # Cost savings compared to approving all
    savings = baseline_loss_approve_all - total_cost
    savings_pct = (savings / baseline_loss_approve_all * 100.0) if baseline_loss_approve_all > 0 else 0.0

    return {
        "fp_cost_unit": cfg.fp_cost,
        "fn_cost_unit": cfg.fn_cost,
        "total_fp_loss": round(total_fp_loss, 2),
        "total_fn_loss": round(total_fn_loss, 2),
        "total_estimated_loss": round(total_cost, 2),
        "baseline_loss_no_model": round(baseline_loss_approve_all, 2),
        "estimated_net_savings": round(savings, 2),
        "estimated_cost_reduction_pct": round(savings_pct, 2),
        "cost_per_transaction": round(total_cost / total_txs, 4) if total_txs > 0 else 0.0,
    }
