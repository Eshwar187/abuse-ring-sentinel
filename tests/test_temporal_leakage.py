"""
Temporal Leakage Verification Tests.

Proves:
1. Current transaction is NEVER included in historical velocity or counts.
2. Future transactions NEVER leak into earlier transaction feature calculations.
3. Personal spending baseline uses strictly historical transactions (timestamp < t_pred).
"""

import unittest
from datetime import datetime
from src.features.behavioral import PointInTimeBehavioralEngine


class TestTemporalLeakage(unittest.TestCase):
    """Test suite ensuring zero temporal lookahead leakage in behavioral features."""

    def test_point_in_time_velocity_windows(self):
        """
        Scenario: User conducts 4 transactions across a day.
        T1: 10:00 (amount $100)
        T2: 10:30 (amount $50)  -> 30m after T1
        T3: 11:15 (amount $200) -> 45m after T2, 1h15m after T1
        T4: 16:00 (amount $80)  -> >4h after T3
        """
        engine = PointInTimeBehavioralEngine()
        user_id = "usr_leakage_test"

        t1 = {
            "transaction_id": "tx_01",
            "timestamp": "2026-02-01 10:00:00",
            "user_id": user_id,
            "amount": 100.0,
            "is_promo_used": 1,
            "product_category": "apparel",
        }
        t2 = {
            "transaction_id": "tx_02",
            "timestamp": "2026-02-01 10:30:00",
            "user_id": user_id,
            "amount": 50.0,
            "is_promo_used": 0,
            "product_category": "apparel",
        }
        t3 = {
            "transaction_id": "tx_03",
            "timestamp": "2026-02-01 11:15:00",
            "user_id": user_id,
            "amount": 200.0,
            "is_promo_used": 0,
            "product_category": "apparel",
        }
        t4 = {
            "transaction_id": "tx_04",
            "timestamp": "2026-02-01 16:00:00",
            "user_id": user_id,
            "amount": 80.0,
            "is_promo_used": 0,
            "product_category": "apparel",
        }

        # Step 1: Score T1 (10:00)
        f1 = engine.extract_features(t1)
        self.assertEqual(f1["user_tx_count_1h"], 0, "T1 must have 0 prior transactions in 1h")
        self.assertEqual(f1["user_tx_count_24h"], 0, "T1 must have 0 prior transactions in 24h")
        self.assertEqual(f1["user_historical_tx_count"], 0)
        # Commit T1
        engine.commit_transaction(t1)

        # Step 2: Score T2 (10:30)
        f2 = engine.extract_features(t2)
        self.assertEqual(f2["user_tx_count_1h"], 1, "T2 must see exactly 1 prior tx (T1)")
        self.assertEqual(f2["user_tx_count_24h"], 1)
        self.assertEqual(f2["user_historical_tx_count"], 1)
        self.assertEqual(f2["user_historical_mean_amount"], 100.0, "T2 historical mean must only reflect T1 ($100)")
        self.assertEqual(f2["user_promo_rate"], 1.0, "T2 promo rate must reflect T1 (1/1 = 1.0)")
        # Commit T2
        engine.commit_transaction(t2)

        # Step 3: Score T3 (11:15)
        f3 = engine.extract_features(t3)
        # At 11:15, T2 (10:30) is within 1h (45m ago), but T1 (10:00) is 1h15m ago (> 1h)
        self.assertEqual(f3["user_tx_count_1h"], 1, "T3 must see only T2 in 1h window")
        self.assertEqual(f3["user_tx_count_24h"], 2, "T3 must see T1 and T2 in 24h window")
        self.assertEqual(f3["user_historical_tx_count"], 2)
        self.assertEqual(f3["user_historical_mean_amount"], 75.0, "T3 historical mean must be (100 + 50) / 2 = $75.0")
        self.assertEqual(f3["user_promo_rate"], 0.5, "T3 promo rate must be 1/2 = 0.5")
        # Commit T3
        engine.commit_transaction(t3)

        # Step 4: Score T4 (16:00)
        f4 = engine.extract_features(t4)
        self.assertEqual(f4["user_tx_count_1h"], 0, "T4 has no transactions in last 1h")
        self.assertEqual(f4["user_tx_count_24h"], 3, "T4 sees T1, T2, T3 in 24h window")
        self.assertEqual(f4["user_historical_tx_count"], 3)
        self.assertAlmostEqual(f4["user_historical_mean_amount"], (100 + 50 + 200) / 3, places=2)
        # Commit T4
        engine.commit_transaction(t4)


if __name__ == "__main__":
    unittest.main()
