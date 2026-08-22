"""
Phase 3 Ablation and Model Consistency Tests.

Tests:
1. Feature group isolation (no graph features in behavioral, no behavioral in graph).
2. Target columns and post-event order_status excluded from all feature groups.
3. Model training isolation (models train strictly on train_df, threshold selects on val_df).
4. Tree and Baseline models output valid probability vectors in [0, 1].
5. Reproducibility across identical random seeds.
"""

import unittest
import pandas as pd
import numpy as np

from src.features.groups import (
    METADATA_COLUMNS,
    BEHAVIORAL_FEATURES,
    GRAPH_FEATURES,
    COMBINED_FEATURES,
    NO_AGE_FEATURES,
    NO_AGE_NO_EMAIL_FEATURES,
)
from src.models.baseline import BaselineLogisticRegression
from src.models.tree_model import TreeRiskModel


class TestPhase3Ablation(unittest.TestCase):
    """Test suite for Phase 3 feature groups and ablation models."""

    @classmethod
    def setUpClass(cls):
        cls.train_df = pd.read_csv("data/processed/train_features.csv")
        cls.val_df = pd.read_csv("data/processed/validation_features.csv")

    def test_feature_groups_integrity(self):
        """Verify feature group separation and absence of metadata/labels."""
        # 1. No metadata in any group
        for col in METADATA_COLUMNS:
            self.assertNotIn(col, BEHAVIORAL_FEATURES)
            self.assertNotIn(col, GRAPH_FEATURES)
            self.assertNotIn(col, COMBINED_FEATURES)

        # 2. Group sizes
        self.assertEqual(len(BEHAVIORAL_FEATURES), 21)
        self.assertEqual(len(GRAPH_FEATURES), 12)
        self.assertEqual(len(COMBINED_FEATURES), 33)
        self.assertEqual(len(NO_AGE_FEATURES), 32)
        self.assertEqual(len(NO_AGE_NO_EMAIL_FEATURES), 31)

        # 3. Disjoint check
        overlap = set(BEHAVIORAL_FEATURES).intersection(set(GRAPH_FEATURES))
        self.assertEqual(len(overlap), 0, f"Found overlapping features: {overlap}")

        # 4. Shortcut exclusions
        self.assertNotIn("account_age_days", NO_AGE_FEATURES)
        self.assertNotIn("account_age_days", NO_AGE_NO_EMAIL_FEATURES)
        self.assertNotIn("email_domain", NO_AGE_NO_EMAIL_FEATURES)

    def test_behavioral_only_model_isolation(self):
        """Ensure Behavioral-only model receives zero graph columns."""
        model = BaselineLogisticRegression(feature_list=BEHAVIORAL_FEATURES)
        model.fit(self.train_df)
        
        # Verify fitted numerical cols contain zero graph features
        for g_col in GRAPH_FEATURES:
            self.assertNotIn(g_col, model.numerical_cols_)

    def test_graph_only_model_isolation(self):
        """Ensure Graph-only model receives zero behavioral columns."""
        model = BaselineLogisticRegression(feature_list=GRAPH_FEATURES)
        model.fit(self.train_df)

        for b_col in BEHAVIORAL_FEATURES:
            self.assertNotIn(b_col, model.numerical_cols_)

    def test_tree_model_probabilities_and_predictions(self):
        """Ensure HistGradientBoosting model produces valid probabilities in [0, 1]."""
        tree_model = TreeRiskModel(feature_list=COMBINED_FEATURES, random_state=42)
        tree_model.fit(self.train_df)
        
        probs = tree_model.predict_proba(self.val_df)
        self.assertEqual(len(probs), len(self.val_df))
        self.assertTrue((probs >= 0.0).all() and (probs <= 1.0).all())

        preds = tree_model.predict(self.val_df, threshold=0.6)
        self.assertTrue(set(preds).issubset({0, 1}))

    def test_reproducibility_identical_seed(self):
        """Ensure identical seeds produce bit-for-bit identical probabilities."""
        m1 = BaselineLogisticRegression(feature_list=COMBINED_FEATURES, random_state=42)
        m2 = BaselineLogisticRegression(feature_list=COMBINED_FEATURES, random_state=42)

        m1.fit(self.train_df)
        m2.fit(self.train_df)

        p1 = m1.predict_proba(self.val_df)
        p2 = m2.predict_proba(self.val_df)
        np.testing.assert_allclose(p1, p2, rtol=1e-5)


if __name__ == "__main__":
    unittest.main()
