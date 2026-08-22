"""
Tree-Based Non-Linear Risk Model.

Implements HistGradientBoostingClassifier with balanced class weighting,
categorical encoding, and probabilistic risk scoring.
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.preprocessing import OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline


class TreeRiskModel:
    """
    Non-linear gradient boosted tree classifier for risk detection.
    """

    CATEGORICAL_COLS = ["product_category", "email_domain"]
    METADATA_COLS = ["transaction_id", "timestamp", "is_abuse_ring"]

    def __init__(
        self,
        feature_list: Optional[List[str]] = None,
        max_iter: int = 150,
        learning_rate: float = 0.08,
        min_samples_leaf: int = 20,
        l2_regularization: float = 1.0,
        random_state: int = 42
    ):
        self.feature_list = feature_list
        self.max_iter = max_iter
        self.learning_rate = learning_rate
        self.min_samples_leaf = min_samples_leaf
        self.l2_regularization = l2_regularization
        self.random_state = random_state
        self.pipeline: Optional[Pipeline] = None
        self.feature_names_: List[str] = []

    def _prepare_columns(self, df: pd.DataFrame) -> Tuple[List[str], List[str]]:
        if self.feature_list is not None:
            active_cols = [c for c in self.feature_list if c in df.columns]
        else:
            active_cols = [c for c in df.columns if c not in self.METADATA_COLS]

        cat_cols = [c for c in self.CATEGORICAL_COLS if c in active_cols]
        num_cols = [c for c in active_cols if c not in cat_cols]
        return num_cols, cat_cols

    def fit(self, train_df: pd.DataFrame, target_col: str = "is_abuse_ring") -> "TreeRiskModel":
        """Fits preprocessor and HistGradientBoostingClassifier strictly on train_df."""
        y_train = train_df[target_col].values
        num_cols, cat_cols = self._prepare_columns(train_df)
        self.feature_names_ = num_cols + cat_cols

        transformers = []
        if cat_cols:
            cat_transformer = OrdinalEncoder(
                handle_unknown="use_encoded_value",
                unknown_value=-1
            )
            transformers.append(("cat", cat_transformer, cat_cols))

        if transformers:
            preprocessor = ColumnTransformer(
                transformers=transformers,
                remainder="passthrough"
            )
        else:
            preprocessor = "passthrough"

        clf = HistGradientBoostingClassifier(
            max_iter=self.max_iter,
            learning_rate=self.learning_rate,
            min_samples_leaf=self.min_samples_leaf,
            l2_regularization=self.l2_regularization,
            class_weight="balanced",
            random_state=self.random_state,
        )

        self.pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf),
        ])

        X_train = train_df[num_cols + cat_cols]
        self.pipeline.fit(X_train, y_train)
        return self

    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        """Returns risk probabilities P(y=1) for input transactions."""
        if self.pipeline is None:
            raise RuntimeError("Model must be fit before calling predict_proba.")
        num_cols, cat_cols = self._prepare_columns(df)
        X = df[num_cols + cat_cols]
        return self.pipeline.predict_proba(X)[:, 1]

    def predict(self, df: pd.DataFrame, threshold: float = 0.5) -> np.ndarray:
        """Returns binary predictions at the specified decision threshold."""
        probs = self.predict_proba(df)
        return (probs >= threshold).astype(int)
