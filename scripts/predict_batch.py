"""
Batch Prediction CLI Script.

Runs the frozen decision engine over a batch feature file, produces
reports/predictions.csv, and logs inference monitoring summary metrics.
DO NOT RUN ON HELD-OUT TEST DATA BEFORE FINAL EVALUATION PHASE.

Usage:
    py scripts/predict_batch.py --input data/processed/validation_features.csv --output reports/predictions.csv
"""

import sys
import os
import argparse

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tabulate import tabulate
import pandas as pd

from src.decision.engine import RiskDecisionEngine
from src.monitoring.summary import summarize_prediction_batch
from src.audit.logger import AuditLogger


def parse_args():
    parser = argparse.ArgumentParser(description="Run batch risk scoring and reason code extraction.")
    parser.add_argument("--input", type=str, required=True, help="Path to input features CSV (e.g. validation_features.csv)")
    parser.add_argument("--output", type=str, default="reports/predictions.csv", help="Path for output predictions CSV")
    parser.add_argument("--audit-log", type=str, default="reports/audit_log.jsonl", help="Path for audit log file")
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 80)
    print("ABUSE-RING SENTINEL: BATCH RISK SCORING & DECISION PIPELINE")
    print("=" * 80)
    print(f"Reading input dataset: {os.path.abspath(args.input)}")
    print(f"Output predictions:    {os.path.abspath(args.output)}")

    # Guard: Warn if someone accidentally points to test_features.csv in Phase 4
    if "test_features" in args.input.lower():
        print("\n[GUARD WARNING]: test_features.csv detected. Ensure this is intentional for final evaluation.")

    input_df = pd.read_csv(args.input)
    print(f"Loaded {len(input_df)} transactions.")

    engine = RiskDecisionEngine()
    audit_logger = AuditLogger(log_path=args.audit_log)

    prediction_records = []
    for idx, row in input_df.iterrows():
        tx_dict = {k: v for k, v in row.to_dict().items() if k != "is_abuse_ring"}
        tx_id = str(tx_dict.get("transaction_id", f"tx_{idx:06d}"))

        # Evaluate through decision engine
        decision_result = engine.evaluate_features(tx_dict, transaction_id=tx_id)
        audit_logger.log(decision_result)

        reasons = decision_result["reason_codes"]
        r1 = reasons[0]["code"] if len(reasons) > 0 else ""
        r2 = reasons[1]["code"] if len(reasons) > 1 else ""
        r3 = reasons[2]["code"] if len(reasons) > 2 else ""

        prediction_records.append({
            "transaction_id": tx_id,
            "risk_score": decision_result["risk_score"],
            "risk_level": decision_result["risk_level"],
            "decision": decision_result["decision"],
            "top_reason_1": r1,
            "top_reason_2": r2,
            "top_reason_3": r3,
            "model_version": decision_result["model_metadata"]["model_version"],
        })

    preds_df = pd.DataFrame(prediction_records)
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    preds_df.to_csv(args.output, index=False)
    print(f"Saved {len(preds_df)} predictions to: {os.path.abspath(args.output)}")

    # Monitoring Summary
    summary = summarize_prediction_batch(preds_df)
    summary_dict = summary.to_dict()

    print("\n" + "=" * 80)
    print("INFERENCE MONITORING SUMMARY (Operational Batch Metrics)")
    print("=" * 80)
    mon_table = [
        ["Total Evaluated Transactions", summary_dict["total_transactions"], "100.0%"],
        ["APPROVE Decisions (Low Risk)", summary_dict["approve_count"], f"{summary_dict['approve_pct']:.2f}%"],
        ["REVIEW Decisions (Medium Risk / 2FA)", summary_dict["review_count"], f"{summary_dict['review_pct']:.2f}%"],
        ["BLOCK Decisions (High Risk)", summary_dict["block_count"], f"{summary_dict['block_pct']:.2f}%"],
        ["Mean Risk Score", summary_dict["mean_risk_score"], "Batch arithmetic average"],
        ["Median Risk Score", summary_dict["median_risk_score"], "50th percentile"],
        ["P95 Risk Score", summary_dict["p95_risk_score"], "95th percentile threshold"],
    ]
    print(tabulate(mon_table, headers=["Metric", "Value", "Notes"], tablefmt="grid"))

    print("\nFirst 5 Prediction Rows:")
    print(tabulate(preds_df.head(5), headers="keys", tablefmt="grid", showindex=False))

    print("\n" + "=" * 80)
    print("Batch processing complete.")
    print("=" * 80)


if __name__ == "__main__":
    main()
