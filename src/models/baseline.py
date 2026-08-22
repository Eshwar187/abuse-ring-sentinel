"""
Baseline Logistic Regression Risk Model.

Implements an interpretable baseline model using scikit-learn LogisticRegression
with balanced class weighting and a scikit-learn ColumnTransformer.
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline


class BaselineLogisticRegression:
    """
    Interpretable baseline classifier with standardized preprocessing.
    """

    CATEGORICAL_COLS = ["product_category", "email_domain"]
    METADATA_COLS = ["transaction_id", "timestamp", "is_abuse_ring"]

    def __init__(self, feature_list: Optional[List[str]] = None, c_reg: float = 1.0, random_state: int = 42):
        self.feature_list = feature_list
        self.c_reg = c_reg
        self.random_state = random_state
        self.pipeline: Optional[Pipeline] = None
        self.feature_names_: List[str] = []
        self.numerical_cols_: List[str] = []

    def _prepare_columns(self, df: pd.DataFrame) -> Tuple[List[str], List[str]]:
        """Identifies feature columns excluding metadata and labels."""
        if self.feature_list is not None:
            active_cols = [c for c in self.feature_list if c in df.columns]
        else:
            active_cols = [c for c in df.columns if c not in self.METADATA_COLS]
            
        cat_cols = [c for c in self.CATEGORICAL_COLS if c in active_cols]
        num_cols = [c for c in active_cols if c not in cat_cols]
        return num_cols, cat_cols

    def fit(self, train_df: pd.DataFrame, target_col: str = "is_abuse_ring") -> "BaselineLogisticRegression":
        """
        Fits preprocessor and Logistic Regression strictly on train_df.
        """
        y_train = train_df[target_col].values
        num_cols, cat_cols = self._prepare_columns(train_df)
        self.numerical_cols_ = num_cols

        # Numerical transformer
        num_transformer = Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ])

        # Categorical transformer
        cat_transformer = Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="unknown")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ])

        transformers = []
        if num_cols:
            transformers.append(("num", num_transformer, num_cols))
        if cat_cols:
            transformers.append(("cat", cat_transformer, cat_cols))

        preprocessor = ColumnTransformer(transformers=transformers)

        clf = LogisticRegression(
            C=self.c_reg,
            class_weight="balanced",
            max_iter=1000,
            random_state=self.random_state,
            solver="lbfgs",
        )

        self.pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf),
        ])

        # Fit strictly on train_df
        X_train = train_df[num_cols + cat_cols]
        self.pipeline.fit(X_train, y_train)

        # Reconstruct transformed feature names for explainability
        if cat_cols:
            cat_encoder = self.pipeline.named_steps["preprocessor"].named_transformers_["cat"].named_steps["onehot"]
            encoded_cat_names = list(cat_encoder.get_feature_names_out(cat_cols))
        else:
            encoded_cat_names = []
            
        self.feature_names_ = num_cols + encoded_cat_names

        return self

    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        """Returns risk probabilities P(y=1) for input transactions."""
        if self.pipeline is None:
            raise RuntimeError("Model must be fit before calling predict_proba.")
        num_cols, cat_cols = self._prepare_columns(df)
        X = df[num_cols + cat_cols]
        probs = self.pipeline.predict_proba(X)[:, 1]
        return probs

    def predict(self, df: pd.DataFrame, threshold: float = 0.5) -> np.ndarray:
        """Returns binary predictions at the specified decision threshold."""
        probs = self.predict_proba(df)
        return (probs >= threshold).astype(int)

    def get_coefficients(self) -> pd.DataFrame:
        """
        Returns sorted table of learned logistic regression feature weights.
        """
        if self.pipeline is None:
            raise RuntimeError("Model must be fit before extracting coefficients.")
        clf = self.pipeline.named_steps["classifier"]
        coefs = clf.coef_[0]

        coef_df = pd.DataFrame({
            "feature": self.feature_names_,
            "coefficient": coefs,
            "abs_weight": np.abs(coefs),
        }).sort_values(by="abs_weight", ascending=False).reset_index(drop=True)

        return coef_df
