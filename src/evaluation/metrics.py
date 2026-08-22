"""
Classification and Risk Evaluation Metrics.

Computes precision, recall, F1, PR-AUC, ROC-AUC, Brier score, and confusion matrix.
"""

from __future__ import annotations
from typing import Dict, Any, NamedTuple
import numpy as np
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    precision_recall_curve,
    auc,
    roc_auc_score,
    confusion_matrix,
    brier_score_loss,
)


class ConfusionMatrixResult(NamedTuple):
    tn: int
    fp: int
    fn: int
    tp: int


def compute_confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray) -> ConfusionMatrixResult:
    """Computes binary confusion matrix counts."""
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()
    return ConfusionMatrixResult(tn=int(tn), fp=int(fp), fn=int(fn), tp=int(tp))


def evaluate_classification_metrics(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: float = 0.5
) -> Dict[str, Any]:
    """
    Computes standard risk classification metrics for a given decision threshold.
    """
    y_pred = (y_prob >= threshold).astype(int)
    cm = compute_confusion_matrix(y_true, y_pred)

    # PR-AUC
    precision_arr, recall_arr, _ = precision_recall_curve(y_true, y_prob)
    pr_auc = float(auc(recall_arr, precision_arr))

    # ROC-AUC
    roc_auc = float(roc_auc_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 0.5

    # Point metrics at threshold
    precision = float(precision_score(y_true, y_pred, zero_division=0))
    recall = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    brier = float(brier_score_loss(y_true, y_prob))

    return {
        "threshold": round(threshold, 4),
        "pr_auc": round(pr_auc, 4),
        "roc_auc": round(roc_auc, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "brier_score": round(brier, 4),
        "true_positives": cm.tp,
        "false_positives": cm.fp,
        "true_negatives": cm.tn,
        "false_negatives": cm.fn,
    }
