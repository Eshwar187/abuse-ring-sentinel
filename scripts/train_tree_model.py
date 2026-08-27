"""
Train Tree-Based Risk Model F (HistGradientBoostingClassifier).

Usage:
    uv run python scripts/train_tree_model.py
"""

import os
import sys
import joblib
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.features.groups import COMBINED_FEATURES
from src.models.tree_model import TreeRiskModel


def main():
    train_path = "data/processed/train_features.csv"
    out_model = "models/model_f.joblib"

    print(f"Loading training data from {train_path}...")
    train_df = pd.read_csv(train_path)
    print(f"Loaded {len(train_df)} rows. Features: {len(COMBINED_FEATURES)}")

    print("Training TreeRiskModel with HistGradientBoostingClassifier...")
    model = TreeRiskModel(feature_list=COMBINED_FEATURES, max_iter=150, learning_rate=0.08, random_state=42)
    model.fit(train_df, target_col="is_abuse_ring")

    os.makedirs(os.path.dirname(out_model), exist_ok=True)
    joblib.dump(model, out_model)
    print(f"Model successfully saved to {out_model}")


if __name__ == "__main__":
    main()
