"""
Decision Engine and Policy Tests.

Tests:
1. Risk score mapping across policy thresholds:
   - score 0.49 -> APPROVE (LOW)
   - score 0.50 -> REVIEW (MEDIUM)
   - score 0.89 -> REVIEW (MEDIUM)
   - score 0.90 -> BLOCK (HIGH)
   - score 1.00 -> BLOCK (HIGH)
2. Schema validation and missing feature errors.
3. Ground-truth column rejection from inference inputs.
4. Determinism of model scoring across identical feature payloads.
"""

import unittest
import pandas as pd
import numpy as np

from src.decision.policy import DecisionPolicy, RiskDecision, RiskLevel
from src.decision.engine import RiskDecisionEngine
from src.serving.model_service import ModelServingService


class TestDecisionEngine(unittest.TestCase):
    """Test suite for decision policy, threshold mapping, and model serving."""

    @classmethod
    def setUpClass(cls):
        cls.policy = DecisionPolicy(review_threshold=0.50, block_threshold=0.90)
        cls.engine = RiskDecisionEngine(policy=cls.policy)
        # Valid sample feature dict from demo data
        demo_df = pd.read_csv("data/demo/demo_transactions.csv")
        cls.valid_features = demo_df.iloc[0].to_dict()
        if "is_abuse_ring" in cls.valid_features:
            del cls.valid_features["is_abuse_ring"]

    def test_policy_threshold_boundaries(self):
        """Verify strict decision mapping at exact policy boundaries."""
        # 1. 0.49 -> APPROVE
        d1, l1 = self.policy.evaluate(0.49)
        self.assertEqual(d1, RiskDecision.APPROVE)
        self.assertEqual(l1, RiskLevel.LOW)

        # 2. 0.50 -> REVIEW
        d2, l2 = self.policy.evaluate(0.50)
        self.assertEqual(d2, RiskDecision.REVIEW)
        self.assertEqual(l2, RiskLevel.MEDIUM)

        # 3. 0.89 -> REVIEW
        d3, l3 = self.policy.evaluate(0.89)
        self.assertEqual(d3, RiskDecision.REVIEW)
        self.assertEqual(l3, RiskLevel.MEDIUM)

        # 4. 0.90 -> BLOCK
        d4, l4 = self.policy.evaluate(0.90)
        self.assertEqual(d4, RiskDecision.BLOCK)
        self.assertEqual(l4, RiskLevel.HIGH)

        # 5. 1.00 -> BLOCK
        d5, l5 = self.policy.evaluate(1.00)
        self.assertEqual(d5, RiskDecision.BLOCK)
        self.assertEqual(l5, RiskLevel.HIGH)

    def test_risk_score_in_bounds(self):
        """Verify model output risk_score is bounded in [0.0, 1.0]."""
        res = self.engine.evaluate_features(self.valid_features)
        score = res["risk_score"]
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)

    def test_missing_required_feature_raises_error(self):
        """Verify that omitting a required feature triggers a clear ValueError."""
        incomplete_features = self.valid_features.copy()
        del incomplete_features["account_age_days"]
        with self.assertRaises(ValueError) as ctx:
            self.engine.evaluate_features(incomplete_features)
        self.assertIn("Missing required feature columns", str(ctx.exception))

    def test_ground_truth_rejection(self):
        """Verify that passing ground-truth labels directly triggers a security rejection."""
        contaminated_features = self.valid_features.copy()
        contaminated_features["is_abuse_ring"] = 1
        with self.assertRaises(ValueError) as ctx:
            self.engine.evaluate_features(contaminated_features)
        self.assertIn("Ground-truth or post-event fields detected", str(ctx.exception))

    def test_deterministic_scoring(self):
        """Verify identical feature payloads produce identical scores and decisions."""
        res1 = self.engine.evaluate_features(self.valid_features)
        res2 = self.engine.evaluate_features(self.valid_features)
        self.assertEqual(res1["risk_score"], res2["risk_score"])
        self.assertEqual(res1["decision"], res2["decision"])


if __name__ == "__main__":
    unittest.main()
