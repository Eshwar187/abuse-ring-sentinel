"""
Evaluate Baseline on Validation Set.

Evaluates the baseline Logistic Regression model strictly on the Validation set (Mar 01 -> Mar 15).
Runs threshold sensitivity analysis and cost-sensitive optimization.
HELD-OUT TEST SET IS STRICTLY PROHIBITED FROM THIS EVALUATION.

Usage:
    py scripts/evaluate_validation.py --val-path data/processed/validation_features.csv --model-path models/baseline_logreg.joblib
"""

import sys
import os
import argparse
import joblib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tabulate import tabulate
import pandas as pd
import numpy as np

from src.evaluation.metrics import evaluate_classification_metrics
from src.evaluation.cost import CostMatrixConfig, compute_business_loss
from src.evaluation.threshold import evaluate_threshold_curve, find_optimal_threshold


def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate baseline on validation set with threshold and cost analysis.")
    parser.add_argument("--val-path", type=str, default="data/processed/validation_features.csv", help="Path to validation features CSV")
    parser.add_argument("--model-path", type=str, default="models/baseline_logreg.joblib", help="Path to fitted model")
    parser.add_argument("--fp-cost", type=float, default=10.0, help="Unit cost of false positive ($10 default)")
    parser.add_argument("--fn-cost", type=float, default=50.0, help="Unit cost of false negative ($50 default)")
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 80)
    print("ABUSE-RING SENTINEL: VALIDATION EVALUATION & COST ANALYSIS")
    print("=" * 80)
    print(f"Validation Dataset: {os.path.abspath(args.val_path)}")
    print(f"Model: {os.path.abspath(args.model_path)}")
    print("GUARD: Held-out test set is frozen and NOT loaded in this evaluation.")

    val_df = pd.read_csv(args.val_path)
    model = joblib.load(args.model_path)

    y_true = val_df["is_abuse_ring"].values
    y_prob = model.predict_proba(val_df)

    cost_cfg = CostMatrixConfig(fp_cost=args.fp_cost, fn_cost=args.fn_cost)

    # 1. Standard Metrics at Default Threshold 0.50
    default_metrics = evaluate_classification_metrics(y_true, y_prob, threshold=0.50)
    default_loss = compute_business_loss(
        fp_count=default_metrics["false_positives"],
        fn_count=default_metrics["false_negatives"],
        tp_count=default_metrics["true_positives"],
        tn_count=default_metrics["true_negatives"],
        config=cost_cfg,
    )

    print("\n" + "=" * 80)
    print("1. VALIDATION SET METRICS (Default Threshold tau = 0.50)")
    print("=" * 80)

    val_summary = [
        ["Validation Transactions", len(val_df), "Events between Mar 01 and Mar 15"],
        ["Actual Ring Transactions (y=1)", int(y_true.sum()), f"{(y_true.sum() / len(y_true)) * 100:.2f}% base rate"],
        ["Actual Benign Transactions (y=0)", int((1 - y_true).sum()), f"{((1 - y_true).sum() / len(y_true)) * 100:.2f}% base rate"],
        ["PR-AUC (Precision-Recall Area)", default_metrics["pr_auc"], "Primary Metric for Imbalanced Risk"],
        ["ROC-AUC", default_metrics["roc_auc"], "Discriminative Power"],
        ["Brier Score (Calibration Error)", default_metrics["brier_score"], "Mean Squared Probability Error (lower is better)"],
        ["Precision @ tau=0.50", default_metrics["precision"], f"{default_metrics['precision'] * 100:.1f}% of flagged were rings"],
        ["Recall @ tau=0.50", default_metrics["recall"], f"{default_metrics['recall'] * 100:.1f}% of actual rings caught"],
        ["F1-Score @ tau=0.50", default_metrics["f1"], "Harmonic Mean of Precision & Recall"],
        ["False Positives (Good users blocked)", default_metrics["false_positives"], f"${default_loss['total_fp_loss']:.2f} friction cost"],
        ["False Negatives (Abuse missed)", default_metrics["false_negatives"], f"${default_loss['total_fn_loss']:.2f} unmitigated fraud loss"],
        ["Total Business Loss @ tau=0.50", f"${default_loss['total_estimated_loss']:.2f}", f"Savings: ${default_loss['estimated_net_savings']:.2f} ({default_loss['estimated_cost_reduction_pct']}%)"],
    ]
    print(tabulate(val_summary, headers=["Metric", "Value", "Notes"], tablefmt="grid"))

    # 2. Threshold Sensitivity Sweep
    print("\n" + "=" * 80)
    print("2. THRESHOLD SENSITIVITY SWEEP (tau in [0.10, 0.90])")
    print("=" * 80)
    print(f"Cost Assumptions: C_FP = ${args.fp_cost:.2f} (friction), C_FN = ${args.fn_cost:.2f} (fraud loss)")

    thresholds = np.array([0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90])
    sweep_df = evaluate_threshold_curve(y_true, y_prob, thresholds=thresholds, cost_config=cost_cfg)
    
    sweep_display = sweep_df[[
        "threshold", "precision", "recall", "f1",
        "false_positives", "false_negatives",
        "fp_loss", "fn_loss", "total_estimated_loss", "net_savings"
    ]]
    print(tabulate(sweep_display, headers="keys", tablefmt="grid", showindex=False))

    # 3. Optimal Threshold Selection
    optimal_cost = find_optimal_threshold(sweep_df, criterion="min_cost")
    optimal_f1 = find_optimal_threshold(sweep_df, criterion="max_f1")

    print("\n" + "=" * 80)
    print("3. OPTIMAL DECISION THRESHOLDS ON VALIDATION DATA")
    print("=" * 80)
    opt_table = [
        [
            "Min-Cost Threshold (tau*)",
            optimal_cost["threshold"],
            optimal_cost["precision"],
            optimal_cost["recall"],
            optimal_cost["f1"],
            int(optimal_cost["false_positives"]),
            int(optimal_cost["false_negatives"]),
            f"${optimal_cost['total_estimated_loss']:.2f}",
            f"${optimal_cost['net_savings']:.2f}",
        ],
        [
            "Max-F1 Threshold",
            optimal_f1["threshold"],
            optimal_f1["precision"],
            optimal_f1["recall"],
            optimal_f1["f1"],
            int(optimal_f1["false_positives"]),
            int(optimal_f1["false_negatives"]),
            f"${optimal_f1['total_estimated_loss']:.2f}",
            f"${optimal_f1['net_savings']:.2f}",
        ],
    ]
    print(tabulate(
        opt_table,
        headers=["Selection Strategy", "tau", "Precision", "Recall", "F1", "FP", "FN", "Total Loss", "Net Savings"],
        tablefmt="grid"
    ))

    # 4. Top Feature Importances / Coefficients
    coef_df = model.get_coefficients()
    print("\n" + "=" * 80)
    print("4. MODEL INTERPRETABILITY (Top Feature Coefficients)")
    print("=" * 80)
    print(tabulate(coef_df.head(12), headers=["Feature", "Coefficient", "|Weight|"], tablefmt="grid", showindex=False))

    print("\n" + "=" * 80)
    print("Validation evaluation complete. Zero data from Held-Out Test was used.")
    print("=" * 80)


if __name__ == "__main__":
    main()
