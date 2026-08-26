"""
Model Serving Service for Abuse-Ring Sentinel.

Loads the frozen Phase 3 candidate model artifact once at startup,
validates feature schemas, prevents target leakage into inference,
and produces probabilistic risk scores.
"""

from __future__ import annotations
import os
from typing import Dict, Any, List, Optional
import joblib
import pandas as pd
import numpy as np

from src.features.groups import COMBINED_FEATURES, METADATA_COLUMNS


class ModelServingService:
    """
    Production-style model serving wrapper around the frozen trained risk model.
    """

    DEFAULT_MODEL_PATH = "models/model_f.joblib"

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or self.DEFAULT_MODEL_PATH
        self.model = None

        # Fixed model and pipeline metadata
        self.metadata = {
            "model_name": "abuse_ring_sentinel",
            "model_type": "hist_gradient_boosting",
            "model_version": "phase3-v1",
            "feature_version": "features-v2",
            "training_data_version": "train-20260101-20260228",
            "threshold_version": "val-opt-v1",
        }

        self._load_model()

    def _load_model(self):
        """Loads serialized model artifact from disk."""
        if not os.path.exists(self.model_path):
            alt_path = "models/model_candidate.joblib"
            if os.path.exists(alt_path):
                self.model_path = alt_path
            else:
                raise FileNotFoundError(
                    f"Model artifact not found at {self.model_path}. Please ensure Phase 3 models are generated."
                )

        # Register Cython / scikit-learn module aliases to ensure cross-platform unpickling (e.g. Render / Linux)
        import sys
        try:
            import sklearn._loss as skl_loss
            sys.modules['_loss'] = skl_loss
        except Exception:
            try:
                import sklearn.ensemble._hist_gradient_boosting._loss as hgb_loss
                sys.modules['_loss'] = hgb_loss
            except Exception:
                pass

        self.model = joblib.load(self.model_path)

    def validate_features(self, features: Dict[str, Any]) -> pd.DataFrame:
        """
        Validates feature dictionary against expected schema and rejects ground truth columns.
        """
        # 1. Reject any ground-truth or post-event columns
        forbidden = [col for col in METADATA_COLUMNS if col in features and col not in ("transaction_id", "timestamp")]
        if forbidden:
            raise ValueError(f"Ground-truth or post-event fields detected in inference input: {forbidden}")

        # 2. Check for missing required features
        missing = [f for f in COMBINED_FEATURES if f not in features]
        if missing:
            raise ValueError(f"Missing required feature columns for model inference: {missing}")

        # 3. Create single-row DataFrame with strict column subset
        row_dict = {f: features[f] for f in COMBINED_FEATURES}
        df = pd.DataFrame([row_dict])
        return df

    def predict_risk_score(self, features: Dict[str, Any]) -> float:
        """
        Computes probabilistic risk score in [0, 1] for a single transaction.
        """
        df = self.validate_features(features)
        proba = self.model.predict_proba(df)[0]
        return float(np.clip(proba, 0.0, 1.0))

    def predict_batch(self, df: pd.DataFrame) -> np.ndarray:
        """
        Computes risk scores for a DataFrame of features.
        """
        # Validate columns
        missing = [f for f in COMBINED_FEATURES if f not in df.columns]
        if missing:
            raise ValueError(f"Missing required feature columns in batch input: {missing}")

        X = df[COMBINED_FEATURES]
        probs = self.model.predict_proba(X)
        return np.clip(probs, 0.0, 1.0)
