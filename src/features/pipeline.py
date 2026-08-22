"""
Feature Engineering Orchestration Pipeline.

Orchestrates sequential, point-in-time feature extraction across all transactions.
Splits output into chronological Train, Validation, and Held-Out Test feature sets.
"""

from __future__ import annotations
import os
from datetime import datetime
from typing import Tuple, Dict, Any, List
import pandas as pd

from src.features.behavioral import PointInTimeBehavioralEngine
from src.features.graph import PointInTimeGraphEngine


class FeaturePipeline:
    """
    Chronological feature builder ensuring zero lookahead leakage.
    """

    # Chronological partition boundaries
    TRAIN_START = "2026-01-01 00:00:00"
    VAL_START = "2026-03-01 00:00:00"
    TEST_START = "2026-03-16 00:00:00"
    TEST_END = "2026-03-31 23:59:59"

    def __init__(self, raw_data_dir: str = "data/raw"):
        self.raw_data_dir = raw_data_dir
        self.behavioral_engine: Optional[PointInTimeBehavioralEngine] = None
        self.graph_engine: Optional[PointInTimeGraphEngine] = None

    def build_features(
        self,
        transactions_df: Optional[pd.DataFrame] = None,
        users_df: Optional[pd.DataFrame] = None
    ) -> pd.DataFrame:
        """
        Executes sequential point-in-time feature extraction.
        """
        if transactions_df is None:
            tx_path = os.path.join(self.raw_data_dir, "transactions.csv")
            transactions_df = pd.read_csv(tx_path)

        if users_df is None:
            user_path = os.path.join(self.raw_data_dir, "users.csv")
            users_df = pd.read_csv(user_path)

        # Initialize engines
        self.behavioral_engine = PointInTimeBehavioralEngine(users_df)
        self.graph_engine = PointInTimeGraphEngine()

        # Ensure strict chronological ordering
        df = transactions_df.copy()
        df["dt"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values(by="dt").reset_index(drop=True)
        df = df.drop(columns=["dt"])

        feature_records: List[Dict[str, Any]] = []

        # Sequential point-in-time processing loop
        for idx, row in df.iterrows():
            tx_dict = row.to_dict()

            # 1. Extract Behavioral Features (before committing)
            behav_feats = self.behavioral_engine.extract_features(tx_dict)

            # 2. Extract Graph Features (before committing)
            graph_feats = self.graph_engine.extract_features(tx_dict)

            # 3. Assemble complete row
            record: Dict[str, Any] = {
                "transaction_id": str(tx_dict["transaction_id"]),
                "timestamp": str(tx_dict["timestamp"]),
                "is_abuse_ring": int(tx_dict["is_abuse_ring"]),  # Target y
            }
            record.update(behav_feats)
            record.update(graph_feats)
            feature_records.append(record)

            # 4. Commit current transaction to historical state for future events
            self.behavioral_engine.commit_transaction(tx_dict)
            self.graph_engine.commit_transaction(tx_dict)

        features_df = pd.DataFrame(feature_records)
        return features_df

    def partition_datasets(
        self,
        features_df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Splits features DataFrame into chronological Train, Validation, and Held-Out Test sets.
        """
        ts = pd.to_datetime(features_df["timestamp"])
        train_mask = (ts >= self.TRAIN_START) & (ts < self.VAL_START)
        val_mask = (ts >= self.VAL_START) & (ts < self.TEST_START)
        test_mask = (ts >= self.TEST_START) & (ts <= self.TEST_END)

        train_df = features_df[train_mask].reset_index(drop=True)
        val_df = features_df[val_mask].reset_index(drop=True)
        test_df = features_df[test_mask].reset_index(drop=True)

        return train_df, val_df, test_df

    def run_and_save(self, output_dir: str = "data/processed") -> Dict[str, str]:
        """
        Extracts features, partitions chronologically, and saves to data/processed/.
        """
        os.makedirs(output_dir, exist_ok=True)
        features_df = self.build_features()
        train_df, val_df, test_df = self.partition_datasets(features_df)

        train_path = os.path.join(output_dir, "train_features.csv")
        val_path = os.path.join(output_dir, "validation_features.csv")
        test_path = os.path.join(output_dir, "test_features.csv")

        train_df.to_csv(train_path, index=False)
        val_df.to_csv(val_path, index=False)
        test_df.to_csv(test_path, index=False)

        return {
            "train_path": train_path,
            "val_path": val_path,
            "test_path": test_path,
            "train_rows": len(train_df),
            "val_rows": len(val_df),
            "test_rows": len(test_df),
        }
