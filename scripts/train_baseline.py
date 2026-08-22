"""
Train Baseline Logistic Regression Model.

Fits a scikit-learn Logistic Regression baseline model strictly on the Train feature set.

Usage:
    py scripts/train_baseline.py --train-path data/processed/train_features.csv --out-model models/baseline_logreg.joblib
"""

import sys
import os
import argparse
import joblib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tabulate import tabulate
import pandas as pd
from src.models.baseline import BaselineLogisticRegression


def parse_args():
    parser = argparse.ArgumentParser(description="Train baseline Logistic Regression on train_features.csv.")
    parser.add_argument("--train-path", type=str, default="data/processed/train_features.csv", help="Path to train features CSV")
    parser.add_argument("--out-model", type=str, default="models/baseline_logreg.joblib", help="Output path for serialized model")
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 80)
    print("ABUSE-RING SENTINEL: BASELINE MODEL TRAINING")
    print("=" * 80)
    print(f"Loading training data from: {os.path.abspath(args.train_path)}")

    train_df = pd.read_csv(args.train_path)
    print(f"Loaded {len(train_df)} training rows.")
    print(f"Class distribution: {train_df['is_abuse_ring'].value_counts().to_dict()} (Positive rate: {train_df['is_abuse_ring'].mean() * 100:.2f}%)")

    # Fit Baseline Model
    print("\nTraining LogisticRegression(class_weight='balanced', C=1.0, max_iter=1000)...")
    model = BaselineLogisticRegression(c_reg=1.0, random_state=42)
    model.fit(train_df, target_col="is_abuse_ring")

    # Save Model
    os.makedirs(os.path.dirname(args.out_model) or ".", exist_ok=True)
    joblib.dump(model, args.out_model)
    print(f"Fitted model saved to: {os.path.abspath(args.out_model)}")

    # Display Top Learned Coefficients
    coef_df = model.get_coefficients()
    print("\nTop 15 Learned Model Features by Absolute Coefficient Weight:")
    print(tabulate(coef_df.head(15), headers=["Feature", "Coefficient", "|Weight|"], tablefmt="grid", showindex=False))

    print("\n" + "=" * 80)
    print("Baseline model training complete.")
    print("=" * 80)


if __name__ == "__main__":
    main()
