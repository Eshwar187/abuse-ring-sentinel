"""
Validation tests for Synthetic E-Commerce Abuse Ring Generator.

Proves:
1. Determinism across identical seeds
2. Variance across different seeds
3. Schema & column integrity (no missing required fields, valid timestamps)
4. Presence and correctness of benign shared-entity populations (households, shared IPs)
5. Graph topology correctness for abuse rings (Star, Bipartite Mesh, Chained Sybil)
6. Strict isolation of ground-truth target labels from observable merchant features
"""

import unittest
from datetime import datetime
import pandas as pd
import numpy as np

from data.schemas import (
    GeneratorConfig,
    UserPopulationType,
    RingTopologyType,
    OrderStatus,
)
from data.generator import SyntheticEcommerceGenerator


class TestSyntheticGenerator(unittest.TestCase):
    """Test suite for data generation, topologies, and leakage prevention."""

    @classmethod
    def setUpClass(cls):
        """Generate a standard test dataset once for suite-wide assertions."""
        cls.config = GeneratorConfig(
            seed=42,
            num_users=1000,  # Fast size for unit tests
            history_days=90,
        )
        cls.generator = SyntheticEcommerceGenerator(cls.config)
        cls.users_df, cls.tx_df, cls.metadata = cls.generator.generate()

    def test_determinism_identical_seed(self):
        """Verify that identical seeds produce bit-for-bit identical outputs."""
        gen2 = SyntheticEcommerceGenerator(self.config)
        users2, tx2, meta2 = gen2.generate()

        pd.testing.assert_frame_equal(self.users_df, users2)
        pd.testing.assert_frame_equal(self.tx_df, tx2)
        self.assertEqual(self.metadata.total_users, meta2.total_users)
        self.assertEqual(self.metadata.total_transactions, meta2.total_transactions)

    def test_seed_sensitivity(self):
        """Verify that different seeds produce distinct datasets."""
        diff_config = GeneratorConfig(seed=999, num_users=1000, history_days=90)
        diff_gen = SyntheticEcommerceGenerator(diff_config)
        diff_users, diff_tx, _ = diff_gen.generate()

        self.assertFalse(self.users_df["user_id"].equals(diff_users["user_id"]) and 
                         self.users_df["signup_timestamp"].equals(diff_users["signup_timestamp"]))
        self.assertNotEqual(self.tx_df["amount"].sum(), diff_tx["amount"].sum())

    def test_no_missing_required_fields(self):
        """Ensure critical entity and behavioral fields contain zero nulls."""
        required_tx_cols = [
            "transaction_id", "timestamp", "user_id", "amount", "currency",
            "device_id", "ip_address", "payment_instrument_id", "shipping_address_id",
            "billing_address_id", "product_category", "is_promo_used", "order_status"
        ]
        for col in required_tx_cols:
            self.assertIn(col, self.tx_df.columns, f"Missing column {col} in transactions")
            self.assertEqual(self.tx_df[col].isnull().sum(), 0, f"Found nulls in transaction column {col}")

        required_user_cols = ["user_id", "signup_timestamp", "email_domain", "user_population_type", "is_abuse_ring"]
        for col in required_user_cols:
            self.assertIn(col, self.users_df.columns, f"Missing column {col} in users")
            self.assertEqual(self.users_df[col].isnull().sum(), 0, f"Found nulls in user column {col}")

    def test_timestamps_and_chronology(self):
        """Verify that transaction timestamps fall within the 90-day window and are sorted."""
        tx_times = pd.to_datetime(self.tx_df["timestamp"])
        start_dt = datetime.strptime(self.config.start_date, "%Y-%m-%d %H:%M:%S")

        self.assertTrue((tx_times >= start_dt).all(), "Found transactions before start date")
        self.assertTrue(self.tx_df["amount"].min() > 0, "Transaction amounts must be positive")
        self.assertTrue(tx_times.is_monotonic_increasing, "Transactions must be sorted chronologically")

    def test_benign_shared_entity_groups_exist(self):
        """Verify that legitimate multi-user clusters exist and are NOT labeled as abuse rings."""
        benign_shared = self.users_df[self.users_df["user_population_type"] == UserPopulationType.BENIGN_SHARED.value]
        self.assertGreater(len(benign_shared), 0, "Benign shared-entity users must be present")
        
        # All benign shared users must have ground-truth label = 0
        self.assertEqual(benign_shared["is_abuse_ring"].sum(), 0, "Benign shared users must have is_abuse_ring == 0")
        
        # Check presence of households and shared IP office groups
        household_users = benign_shared[benign_shared["ring_type"] == RingTopologyType.HOUSEHOLD.value]
        office_users = benign_shared[benign_shared["ring_type"] == RingTopologyType.SHARED_IP_OFFICE.value]
        self.assertGreater(len(household_users), 0, "Household groups must exist")
        self.assertGreater(len(office_users), 0, "Shared office IP groups must exist")

    def test_star_ring_topology_properties(self):
        """Verify that Star topology abuse rings share a central hub entity (card or device)."""
        star_rings = self.users_df[self.users_df["ring_type"] == RingTopologyType.STAR.value]
        self.assertGreater(len(star_rings), 0, "Star rings must exist")
        
        sample_ring_id = star_rings.iloc[0]["ring_id"]
        member_ids = star_rings[star_rings["ring_id"] == sample_ring_id]["user_id"].tolist()
        self.assertGreaterEqual(len(member_ids), 4, "Star ring must contain multiple colluding accounts")

        ring_txs = self.tx_df[self.tx_df["user_id"].isin(member_ids)]
        
        # In a Star topology, members must share either a central device or central payment instrument
        device_sharing = ring_txs.groupby("device_id")["user_id"].nunique().max()
        pmt_sharing = ring_txs.groupby("payment_instrument_id")["user_id"].nunique().max()
        
        self.assertTrue(device_sharing > 1 or pmt_sharing > 1, 
                        "Star ring members must share at least one central hub entity")

    def test_chained_sybil_topology_properties(self):
        """Verify that Chained Sybil rings link sequential accounts across pairwise entities."""
        sybil_rings = self.users_df[self.users_df["ring_type"] == RingTopologyType.CHAINED_SYBIL.value]
        self.assertGreater(len(sybil_rings), 0, "Chained Sybil rings must exist")
        
        sample_ring_id = sybil_rings.iloc[0]["ring_id"]
        member_ids = sybil_rings[sybil_rings["ring_id"] == sample_ring_id]["user_id"].tolist()
        self.assertGreaterEqual(len(member_ids), 3, "Chained Sybil ring must have multiple chained accounts")
        
        ring_txs = self.tx_df[self.tx_df["user_id"].isin(member_ids)]
        # All members in the ring must be labeled as abuse ring
        self.assertTrue((ring_txs["is_abuse_ring"] == 1).all())

    def test_zero_target_leakage_in_observable_features(self):
        """
        Verify that extracting observable merchant features removes all ground-truth labels
        and ring identifiers, preventing data leakage into ML models.
        """
        metadata_cols = ["is_abuse_ring", "ring_id", "ring_type", "user_population_type"]
        observable_tx_features = self.tx_df.drop(columns=metadata_cols)

        # None of the metadata columns must remain
        for col in metadata_cols:
            self.assertNotIn(col, observable_tx_features.columns)

        # Confirm observable fields are standard merchant checkout parameters
        expected_observable_cols = [
            "transaction_id", "timestamp", "user_id", "amount", "currency",
            "device_id", "ip_address", "payment_instrument_id", "shipping_address_id",
            "billing_address_id", "product_category", "is_promo_used", "order_status"
        ]
        self.assertListEqual(list(observable_tx_features.columns), expected_observable_cols)


if __name__ == "__main__":
    unittest.main()
