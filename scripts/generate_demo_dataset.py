"""
Generate Demonstration Dataset and Results.

Extracts 5 representative demonstration cases from validation data:
1. Benign Isolated User -> APPROVE (Low Risk)
2. Benign Shared Household -> APPROVE (Low Risk - proving sharing does not auto-block)
3. Benign Shared Office IP -> APPROVE (Low Risk)
4. Coordinated Abuse Ring -> BLOCK (High Risk with graph reason codes)
5. New User with Promo -> REVIEW / STEP-UP (Medium Risk)

Usage:
    py scripts/generate_demo_dataset.py
"""

import os
import sys
import json
import pandas as pd
from tabulate import tabulate

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.decision.engine import RiskDecisionEngine


def main():
    val_df = pd.read_csv("data/processed/validation_features.csv")
    raw_tx = pd.read_csv("data/raw/transactions.csv")

    merged = pd.merge(
        val_df,
        raw_tx[["transaction_id", "user_population_type", "ring_type", "ring_id"]],
        on="transaction_id",
        how="left"
    )

    # 1. Benign Isolated User
    iso = merged[(merged["user_population_type"] == "BENIGN_ISOLATED") & (merged["account_age_days"] > 60)].iloc[0]

    # 2. Benign Household (Shared address + IP, but legitimate)
    hh = merged[merged["ring_type"] == "HOUSEHOLD"].iloc[0]

    # 3. Benign Shared Office Network (Shared IP)
    off = merged[merged["ring_type"] == "SHARED_IP_OFFICE"].iloc[0]

    # 4. High-Risk Coordinated Abuse Ring (Mesh/Star with shared devices and high velocity)
    ring = merged[(merged["user_population_type"] == "ABUSE_RING") & (merged["device_prior_user_count"] >= 3)].iloc[0]

    # 5. Borderline / Review Case (New benign user placing promo order)
    borderline = merged[(merged["user_population_type"] == "BENIGN_ISOLATED") & (merged["account_age_days"] < 10) & (merged["is_promo_used"] == 1)].iloc[0]

    demo_cases = [iso, hh, off, ring, borderline]
    demo_descriptions = [
        "Case 1: Established Benign Shopper (Age > 60d, single device/IP)",
        "Case 2: Legitimate Family Household (Sharing address & home Wi-Fi)",
        "Case 3: Corporate Office Colleague (Sharing corporate egress IP)",
        "Case 4: Coordinated Abuse Syndicate (Multi-device sharing & bot burst)",
        "Case 5: Borderline Case (New user with promotional discount voucher)",
    ]

    demo_df = pd.DataFrame(demo_cases)
    os.makedirs("data/demo", exist_ok=True)
    os.makedirs("reports", exist_ok=True)

    # Save feature CSV (without metadata labels or target column)
    feature_cols = [c for c in val_df.columns if c != "is_abuse_ring"]
    demo_features = demo_df[feature_cols]
    demo_features.to_csv("data/demo/demo_transactions.csv", index=False)
    print("Saved demonstration dataset to data/demo/demo_transactions.csv")

    engine = RiskDecisionEngine()
    results = []
    table_rows = []

    for desc, (_, row) in zip(demo_descriptions, demo_features.iterrows()):
        feat_dict = {k: v for k, v in row.to_dict().items() if k != "is_abuse_ring"}
        res = engine.evaluate_features(feat_dict, transaction_id=row["transaction_id"])
        results.append(res)

        reason_str = ", ".join([r["code"] for r in res["reason_codes"][:2]])
        table_rows.append([
            desc,
            res["transaction_id"],
            f"{res['risk_score']:.4f}",
            res["risk_level"],
            res["decision"],
            reason_str,
        ])

    with open("reports/phase4_demo_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("Saved demonstration results to reports/phase4_demo_results.json\n")

    print("=" * 80)
    print("DEMONSTRATION SCENARIOS EVALUATION SUMMARY")
    print("=" * 80)
    print(tabulate(
        table_rows,
        headers=["Scenario", "Tx ID", "Risk Score", "Level", "Decision", "Top Reason Codes"],
        tablefmt="grid"
    ))
    print("=" * 80)


if __name__ == "__main__":
    main()
