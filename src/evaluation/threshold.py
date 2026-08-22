"""
Threshold Sweeping and Sensitivity Analysis.

Evaluates model performance and financial loss across a spectrum of decision
thresholds (e.g. 0.05 -> 0.95) strictly on the Validation set.
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd

from src.evaluation.metrics import evaluate_classification_metrics
from src.evaluation.cost import CostMatrixConfig, compute_business_loss


def evaluate_threshold_curve(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    thresholds: Optional[np.ndarray] = None,
    cost_config: Optional[CostMatrixConfig] = None
) -> pd.DataFrame:
    """
    Evaluates classification metrics and business loss for each candidate threshold.
    """
    if thresholds is None:
        thresholds = np.linspace(0.05, 0.95, 19)

    cfg = cost_config or CostMatrixConfig()
    records: List[Dict[str, Any]] = []

    for t in thresholds:
        metrics = evaluate_classification_metrics(y_true, y_prob, threshold=float(t))
        loss_dict = compute_business_loss(
            fp_count=metrics["false_positives"],
            fn_count=metrics["false_negatives"],
            tp_count=metrics["true_positives"],
            tn_count=metrics["true_negatives"],
            config=cfg,
        )

        row = {
            "threshold": round(float(t), 2),
            "precision": metrics["precision"],
            "recall": metrics["recall"],
            "f1": metrics["f1"],
            "true_positives": metrics["true_positives"],
            "false_positives": metrics["false_positives"],
            "true_negatives": metrics["true_negatives"],
            "false_negatives": metrics["false_negatives"],
            "fp_loss": loss_dict["total_fp_loss"],
            "fn_loss": loss_dict["total_fn_loss"],
            "total_estimated_loss": loss_dict["total_estimated_loss"],
            "net_savings": loss_dict["estimated_net_savings"],
        }
        records.append(row)

    return pd.DataFrame(records)


def find_optimal_threshold(
    threshold_df: pd.DataFrame,
    criterion: str = "min_cost"
) -> Dict[str, Any]:
    """
    Identifies the optimal decision threshold from a threshold sweep DataFrame.
    Criteria:
      - 'min_cost': Minimizes total financial loss (C_FP * FP + C_FN * FN)
      - 'max_f1': Maximizes F1 score
      - 'recall_target_80': Highest precision with recall >= 0.80
    """
    if criterion == "min_cost":
        best_idx = threshold_df["total_estimated_loss"].idxmin()
    elif criterion == "max_f1":
        best_idx = threshold_df["f1"].idxmax()
    elif criterion == "recall_target_80":
        eligible = threshold_df[threshold_df["recall"] >= 0.80]
        if not eligible.empty:
            best_idx = eligible["precision"].idxmax()
        else:
            best_idx = threshold_df["f1"].idxmax()
    else:
        raise ValueError(f"Unknown criterion: {criterion}")

    best_row = threshold_df.loc[best_idx].to_dict()
    best_row["selection_criterion"] = criterion
    return best_row
