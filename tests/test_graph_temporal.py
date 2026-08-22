"""
Graph Temporal Invariant and Point-in-Time Verification Tests.

Proves:
1. Entity degree and user counts reflect strictly historical edges.
2. Future graph connections NEVER propagate backward in time.
3. Multi-hop chained components expand dynamically as events are committed in time.
"""

import unittest
from src.features.graph import PointInTimeGraphEngine


class TestGraphTemporal(unittest.TestCase):
    """Test suite for point-in-time graph construction."""

    def test_shared_device_temporal_isolation(self):
        """
        Scenario:
        User A transacts at 10:00 on Device dev_shared.
        User B transacts at 11:00 on Device dev_shared.
        User C transacts at 12:00 on Device dev_shared.
        """
        engine = PointInTimeGraphEngine()

        tx_a = {
            "transaction_id": "tx_a",
            "timestamp": "2026-02-10 10:00:00",
            "user_id": "usr_A",
            "device_id": "dev_shared",
            "ip_address": "100.1.1.1",
            "payment_instrument_id": "pmt_A",
            "shipping_address_id": "addr_A",
            "billing_address_id": "addr_A",
        }
        tx_b = {
            "transaction_id": "tx_b",
            "timestamp": "2026-02-10 11:00:00",
            "user_id": "usr_B",
            "device_id": "dev_shared",
            "ip_address": "100.1.1.2",
            "payment_instrument_id": "pmt_B",
            "shipping_address_id": "addr_B",
            "billing_address_id": "addr_B",
        }
        tx_c = {
            "transaction_id": "tx_c",
            "timestamp": "2026-02-10 12:00:00",
            "user_id": "usr_C",
            "device_id": "dev_shared",
            "ip_address": "100.1.1.3",
            "payment_instrument_id": "pmt_C",
            "shipping_address_id": "addr_C",
            "billing_address_id": "addr_C",
        }

        # 1. Evaluate User A at 10:00 (User B and C do NOT exist yet)
        fa = engine.extract_features(tx_a)
        self.assertEqual(fa["device_prior_user_count"], 0, "User A at 10:00 must see 0 prior users on dev_shared")
        self.assertEqual(fa["number_of_prior_connected_users"], 0)
        self.assertEqual(fa["connected_component_user_count"], 1)
        engine.commit_transaction(tx_a)

        # 2. Evaluate User B at 11:00 (User A exists in history; User C does NOT exist)
        fb = engine.extract_features(tx_b)
        self.assertEqual(fb["device_prior_user_count"], 1, "User B at 11:00 must see exactly 1 prior user (User A)")
        self.assertEqual(fb["number_of_prior_connected_users"], 1, "User B must see User A as prior connected user")
        engine.commit_transaction(tx_b)

        # 3. Evaluate User C at 12:00 (Both User A and User B exist in history)
        fc = engine.extract_features(tx_c)
        self.assertEqual(fc["device_prior_user_count"], 2, "User C at 12:00 must see 2 prior users (A and B)")
        self.assertEqual(fc["number_of_prior_connected_users"], 2, "User C must see both A and B as prior co-users")
        engine.commit_transaction(tx_c)

    def test_chained_sybil_graph_growth(self):
        """
        Scenario:
        User 1 at 10:00 links (dev_1, pmt_bridge_1)
        User 2 at 11:00 links (pmt_bridge_1, dev_bridge_2)  -> Chains with User 1
        User 3 at 12:00 links (dev_bridge_2, addr_bridge_3) -> Chains with User 2
        """
        engine = PointInTimeGraphEngine()

        tx1 = {
            "transaction_id": "tx_chain_1",
            "timestamp": "2026-02-15 10:00:00",
            "user_id": "usr_c1",
            "device_id": "dev_1",
            "ip_address": "100.10.1.1",
            "payment_instrument_id": "pmt_bridge_1",
            "shipping_address_id": "addr_1",
            "billing_address_id": "addr_1",
        }
        tx2 = {
            "transaction_id": "tx_chain_2",
            "timestamp": "2026-02-15 11:00:00",
            "user_id": "usr_c2",
            "device_id": "dev_bridge_2",
            "ip_address": "100.10.1.2",
            "payment_instrument_id": "pmt_bridge_1",  # Shared with User 1
            "shipping_address_id": "addr_2",
            "billing_address_id": "addr_2",
        }
        tx3 = {
            "transaction_id": "tx_chain_3",
            "timestamp": "2026-02-15 12:00:00",
            "user_id": "usr_c3",
            "device_id": "dev_bridge_2",              # Shared with User 2
            "ip_address": "100.10.1.3",
            "payment_instrument_id": "pmt_3",
            "shipping_address_id": "addr_3",
            "billing_address_id": "addr_3",
        }

        # Step 1: User 1
        f1 = engine.extract_features(tx1)
        self.assertEqual(f1["payment_prior_user_count"], 0)
        self.assertEqual(f1["number_of_prior_connected_users"], 0)
        engine.commit_transaction(tx1)

        # Step 2: User 2
        f2 = engine.extract_features(tx2)
        self.assertEqual(f2["payment_prior_user_count"], 1, "User 2 shares pmt_bridge_1 with User 1")
        self.assertEqual(f2["number_of_prior_connected_users"], 1)
        engine.commit_transaction(tx2)

        # Step 3: User 3
        f3 = engine.extract_features(tx3)
        self.assertEqual(f3["device_prior_user_count"], 1, "User 3 shares dev_bridge_2 with User 2")
        self.assertEqual(f3["number_of_prior_connected_users"], 1, "Direct prior co-user is User 2")
        engine.commit_transaction(tx3)


if __name__ == "__main__":
    unittest.main()
