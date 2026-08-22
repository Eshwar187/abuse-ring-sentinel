"""
Build Features Script.

Runs the point-in-time feature extraction pipeline over raw data and
saves partitioned train, validation, and held-out test datasets.

Usage:
    py scripts/build_features.py --raw-dir data/raw --out-dir data/processed
"""

import sys
import os
import argparse

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tabulate import tabulate
import pandas as pd
from src.features.pipeline import FeaturePipeline


def parse_args():
    parser = argparse.ArgumentParser(description="Extract point-in-time features and partition datasets.")
    parser.add_argument("--raw-dir", type=str, default="data/raw", help="Path to raw data directory")
    parser.add_argument("--out-dir", type=str, default="data/processed", help="Path to output processed features directory")
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 80)
    print("ABUSE-RING SENTINEL: POINT-IN-TIME FEATURE EXTRACTION")
    print("=" * 80)
    print(f"Reading raw datasets from: {os.path.abspath(args.raw_dir)}")
    print(f"Saving processed partitions to: {os.path.abspath(args.out_dir)}")

    pipeline = FeaturePipeline(raw_data_dir=args.raw_dir)
    results = pipeline.run_and_save(output_dir=args.out_dir)

    train_df = pd.read_csv(results["train_path"])
    val_df = pd.read_csv(results["val_path"])
    test_df = pd.read_csv(results["test_path"])

    feature_cols = [c for c in train_df.columns if c not in ["transaction_id", "timestamp", "is_abuse_ring"]]

    print("\n" + "=" * 80)
    print("FEATURE EXTRACTION SUMMARY")
    print("=" * 80)
    
    summary_table = [
        ["Total Feature Count", len(feature_cols), "All numerical + categorical inputs"],
        ["Train Rows (Jan 01 -> Feb 28)", len(train_df), f"Abuse Ring Rate: {(train_df['is_abuse_ring'] == 1).mean() * 100:.2f}% ({train_df['is_abuse_ring'].sum()} pos)"],
        ["Validation Rows (Mar 01 -> Mar 15)", len(val_df), f"Abuse Ring Rate: {(val_df['is_abuse_ring'] == 1).mean() * 100:.2f}% ({val_df['is_abuse_ring'].sum()} pos)"],
        ["Held-Out Test Rows (Mar 16 -> Mar 31)", len(test_df), f"Abuse Ring Rate: {(test_df['is_abuse_ring'] == 1).mean() * 100:.2f}% (FROZEN / UNTOUCHED)"],
    ]
    print(tabulate(summary_table, headers=["Partition / Property", "Count", "Notes"], tablefmt="grid"))

    print("\nExtracted Feature Columns (23 Total):")
    col_breakdown = []
    for i, col in enumerate(feature_cols, 1):
        dtype = str(train_df[col].dtype)
        col_type = "Graph Topological" if any(k in col for k in ["prior_user_count", "connected", "shared_entity", "density"]) else "Behavioral / Payload"
        col_breakdown.append([i, col, dtype, col_type])
    print(tabulate(col_breakdown, headers=["#", "Feature Column Name", "Data Type", "Category"], tablefmt="grid"))

    print("\n" + "=" * 80)
    print("Features generated and saved successfully.")
    print("Note: The held-out test partition is saved strictly for future evaluation and remains untouched.")
    print("=" * 80)


if __name__ == "__main__":
    main()
