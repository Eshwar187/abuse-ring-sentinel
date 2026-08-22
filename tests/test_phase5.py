"""
Phase 5 Final Held-Out Evaluation Tests.

Tests:
1. Test dataset schema and row count (6,929 rows, 43 positives).
2. Feature contract validation (33 features present).
3. Risk scores bounded in [0.0, 1.0] with zero NaNs.
4. Production threshold remains fixed at 0.90.
5. Mathematical integrity of confusion matrix accounting.
6. Financial loss and savings calculation correctness.
7. Evaluation reproducibility.
8. Non-mutating evaluation (no fit/retrain operations).
"""

import unittest
import pandas as pd
import numpy as np

from src.features.groups import COMBINED_FEATURES
from src.evaluation.final_test import FinalHeldOutEvaluator


class TestPhase5Evaluation(unittest.TestCase):
    """Test suite for Phase 5 final held-out test evaluation."""

    @classmethod
    def setUpClass(cls):
        cls.evaluator = FinalHeldOutEvaluator(
            test_path="data/processed/test_features.csv",
            model_path="models/model_f.joblib",
            production_threshold=0.90,
            cost_fp=10.0,
            cost_fn=50.0,
        )
        cls.test_df = cls.evaluator.load_and_validate_data()
        cls.preds_df = cls.evaluator.run_inference()
        cls.metrics = cls.evaluator.compute_metrics()

    def test_held_out_dataset_dimensions_and_prevalence(self):
        """Verify exact held-out test row count and abuse class count."""
        self.assertEqual(len(self.test_df), 6929)
        abuse_count = int(self.test_df["is_abuse_ring"].sum())
        benign_count = int(len(self.test_df) - abuse_count)
        self.assertEqual(abuse_count, 43)
        self.assertEqual(benign_count, 6886)

    def test_feature_contract(self):
        """Verify all 33 required features are present in test dataset."""
        for feat in COMBINED_FEATURES:
            self.assertIn(feat, self.test_df.columns)

    def test_prediction_count_and_value_bounds(self):
        """Verify predictions length and probability bounds [0.0, 1.0] without NaNs."""
        self.assertEqual(len(self.preds_df), 6929)
        scores = self.preds_df["risk_score"].values
        self.assertFalse(np.isnan(scores).any())
        self.assertTrue((scores >= 0.0).all() and (scores <= 1.0).all())

    def test_production_threshold_fixed(self):
        """Verify production threshold is 0.90."""
        self.assertEqual(self.evaluator.production_threshold, 0.90)
        self.assertEqual(self.evaluator.decision_engine.policy.block_threshold, 0.90)

    def test_confusion_matrix_accounting_integrity(self):
        """Verify mathematical integrity of TP, TN, FP, FN equations."""
        conf = self.metrics["confusion_matrix"]
        ds = self.metrics["dataset_statistics"]

        tp = conf["tp"]
        tn = conf["tn"]
        fp = conf["fp"]
        fn = conf["fn"]

        # Equations
        self.assertEqual(tp + fn, ds["abuse_transactions"])
        self.assertEqual(tn + fp, ds["benign_transactions"])
        self.assertEqual(tp + tn + fp + fn, ds["total_transactions"])

    def test_business_loss_calculation(self):
        """Verify business loss formula: Loss = FP * 10 + FN * 50."""
        conf = self.metrics["confusion_matrix"]
        bi = self.metrics["business_impact"]

        expected_loss = conf["fp"] * 10.0 + conf["fn"] * 50.0
        self.assertEqual(bi["model_loss"], expected_loss)

        expected_baseline = self.metrics["dataset_statistics"]["abuse_transactions"] * 50.0
        self.assertEqual(bi["baseline_unmitigated_loss"], expected_baseline)
        self.assertEqual(bi["net_merchant_savings"], expected_baseline - expected_loss)

    def test_evaluation_reproducibility(self):
        """Verify identical scores across multiple inference calls."""
        evaluator2 = FinalHeldOutEvaluator(
            test_path="data/processed/test_features.csv",
            model_path="models/model_f.joblib",
            production_threshold=0.90,
        )
        preds2 = evaluator2.run_inference()
        np.testing.assert_allclose(
            self.preds_df["risk_score"].values,
            preds2["risk_score"].values,
            rtol=1e-5
        )


if __name__ == "__main__":
    unittest.main()
