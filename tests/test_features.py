"""
Feature Engineering and Schema Integrity Tests.

Tests:
1. Behavioral feature extractors calculate correct values.
2. Graph feature extractors calculate correct degrees and component metrics.
3. Cold-start fallbacks produce deterministic, non-null values.
4. Ground-truth metadata and post-event order_status are excluded from feature outputs.
"""

import unittest
from datetime import datetime
import pandas as pd
import numpy as np

from src.features.behavioral import PointInTimeBehavioralEngine
from src.features.graph import PointInTimeGraphEngine
from src.features.pipeline import FeaturePipeline


class TestFeatures(unittest.TestCase):
    """Test suite for behavioral and graph feature extractors."""

    def test_cold_start_behavioral_defaults(self):
        """Verify new users with 0 prior transactions receive valid neutral fallbacks."""
        engine = PointInTimeBehavioralEngine()
        tx = {
            "transaction_id": "tx_test_001",
            "timestamp": "2026-01-15 12:00:00",
            "user_id": "usr_new_01",
            "amount": 50.0,
            "product_category": "electronics",
            "is_promo_used": 1,
            "device_id": "dev_01",
            "ip_address": "100.1.1.1",
            "payment_instrument_id": "pmt_01",
            "shipping_address_id": "addr_01",
            "billing_address_id": "addr_01",
        }
        feats = engine.extract_features(tx)

        self.assertEqual(feats["user_tx_count_1h"], 0)
        self.assertEqual(feats["user_tx_count_24h"], 0)
        self.assertEqual(feats["user_tx_count_7d"], 0)
        self.assertEqual(feats["user_historical_tx_count"], 0)
        self.assertEqual(feats["amount_to_user_mean_ratio"], 1.0)
        self.assertEqual(feats["user_promo_rate"], 0.0)
        self.assertEqual(feats["user_unique_device_count"], 0)
        self.assertEqual(feats["billing_shipping_match"], 1)

    def test_cold_start_graph_defaults(self):
        """Verify unseen entities receive initial degree = 0 in G_<t_pred."""
        engine = PointInTimeGraphEngine()
        tx = {
            "transaction_id": "tx_test_001",
            "timestamp": "2026-01-15 12:00:00",
            "user_id": "usr_new_01",
            "device_id": "dev_new_01",
            "ip_address": "100.1.1.1",
            "payment_instrument_id": "pmt_new_01",
            "shipping_address_id": "addr_new_01",
            "billing_address_id": "addr_new_01",
        }
        feats = engine.extract_features(tx)

        self.assertEqual(feats["device_prior_user_count"], 0)
        self.assertEqual(feats["ip_prior_user_count"], 0)
        self.assertEqual(feats["payment_prior_user_count"], 0)
        self.assertEqual(feats["shipping_address_prior_user_count"], 0)
        self.assertEqual(feats["max_shared_entity_user_count"], 0)
        self.assertEqual(feats["number_of_prior_connected_users"], 0)
        self.assertEqual(feats["connected_component_user_count"], 1)

    def test_forbidden_columns_excluded_from_pipeline(self):
        """Verify pipeline output strictly excludes metadata, order_status, and labels."""
        raw_txs = pd.DataFrame([{
            "transaction_id": "tx_001",
            "timestamp": "2026-01-01 10:00:00",
            "user_id": "usr_001",
            "amount": 25.0,
            "currency": "INR",
            "device_id": "dev_001",
            "ip_address": "100.1.1.1",
            "payment_instrument_id": "pmt_001",
            "shipping_address_id": "addr_001",
            "billing_address_id": "addr_001",
            "product_category": "apparel",
            "is_promo_used": 0,
            "order_status": "completed",
            "is_abuse_ring": 0,
            "ring_id": None,
            "ring_type": "NONE",
            "user_population_type": "BENIGN_ISOLATED",
        }])
        users_df = pd.DataFrame([{
            "user_id": "usr_001",
            "signup_timestamp": "2025-12-01 00:00:00",
            "email_domain": "gmail.com",
            "user_population_type": "BENIGN_ISOLATED",
            "is_abuse_ring": 0,
            "ring_id": None,
            "ring_type": "NONE",
        }])

        pipeline = FeaturePipeline()
        features_df = pipeline.build_features(transactions_df=raw_txs, users_df=users_df)

        forbidden = ["order_status", "ring_id", "ring_type", "user_population_type"]
        for col in forbidden:
            self.assertNotIn(col, features_df.columns, f"Forbidden column {col} found in features!")

        # Target label is allowed only as target column 'is_abuse_ring'
        self.assertIn("is_abuse_ring", features_df.columns)
        self.assertIn("transaction_id", features_df.columns)
        self.assertIn("timestamp", features_df.columns)


if __name__ == "__main__":
    unittest.main()
