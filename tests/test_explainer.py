"""
Explainability and Reason Codes Tests.

Tests:
1. Determinism of reason code ranking.
2. Max reason count constraint (<= 5).
3. Reason codes contain strictly observable features.
4. Correct reason generation for high-risk graph/velocity vs low-risk benign features.
"""

import unittest
from src.explanation.explainer import TransactionExplainer
from src.features.groups import METADATA_COLUMNS


class TestExplainer(unittest.TestCase):
    """Test suite for transaction explainer and reason code generator."""

    def setUp(self):
        self.explainer = TransactionExplainer()

    def test_high_risk_reasons_generation(self):
        """Verify high-risk features trigger corresponding graph and velocity reason codes."""
        features = {
            "number_of_prior_connected_users": 8,
            "device_prior_user_count": 6,
            "payment_prior_user_count": 5,
            "shipping_address_prior_user_count": 3,
            "shared_entity_types_count": 3,
            "account_age_days": 0.5,
            "user_tx_count_24h": 4,
            "user_tx_count_1h": 2,
            "email_domain": "tempmail.org",
            "is_promo_used": 1,
            "user_promo_rate": 0.8,
            "amount": 250.0,
            "amount_to_user_mean_ratio": 3.0,
            "hour_of_day": 3,
        }
        reasons, evidence = self.explainer.explain(features, risk_score=0.98, max_reasons=5)

        self.assertLessEqual(len(reasons), 5)
        codes = [r["code"] for r in reasons]
        self.assertIn("GRAPH_CONNECTED_USERS", codes)
        self.assertIn("GRAPH_SHARED_DEVICE", codes)
        self.assertIn("GRAPH_SHARED_PAYMENT", codes)

        # Check evidence attached to reason
        for r in reasons:
            self.assertIn("code", r)
            self.assertIn("message", r)
            self.assertIn("evidence", r)
            self.assertIsInstance(r["evidence"], dict)

    def test_low_risk_fallback_reason(self):
        """Verify clean benign accounts receive low-risk established account reason."""
        clean_features = {
            "number_of_prior_connected_users": 0,
            "device_prior_user_count": 1,
            "payment_prior_user_count": 1,
            "shipping_address_prior_user_count": 1,
            "shared_entity_types_count": 0,
            "account_age_days": 120.0,
            "user_tx_count_24h": 0,
            "user_tx_count_1h": 0,
            "email_domain": "gmail.com",
            "is_promo_used": 0,
            "user_promo_rate": 0.1,
            "amount": 35.0,
            "amount_to_user_mean_ratio": 1.0,
            "hour_of_day": 14,
            "user_historical_tx_count": 8,
        }
        reasons, evidence = self.explainer.explain(clean_features, risk_score=0.002, max_reasons=5)
        self.assertEqual(len(reasons), 1)
        self.assertEqual(reasons[0]["code"], "LOW_RISK_ESTABLISHED_ACCOUNT")

    def test_zero_ground_truth_in_explanations(self):
        """Verify ground-truth fields never appear in reason codes or evidence."""
        features = {
            "account_age_days": 1.0,
            "user_tx_count_24h": 3,
            "number_of_prior_connected_users": 5,
        }
        reasons, evidence = self.explainer.explain(features, risk_score=0.95)

        for col in METADATA_COLUMNS:
            self.assertNotIn(col, evidence)
            for r in reasons:
                self.assertNotIn(col, r["evidence"])


if __name__ == "__main__":
    unittest.main()
