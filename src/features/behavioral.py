"""
Point-in-Time Behavioral Feature Engine.

Calculates behavioral features for an incoming transaction using only:
1. Current checkout payload attributes
2. Account creation metadata available prior to checkout
3. Historical transactions for this user strictly with timestamp < t_pred

Features are guaranteed free of future information.
"""

from __future__ import annotations
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import numpy as np


class UserHistoryRecord:
    """Stores historical transaction events for a single user."""
    __slots__ = (
        "timestamps",
        "amounts",
        "promos",
        "devices",
        "ips",
        "payments",
        "addresses",
    )

    def __init__(self):
        self.timestamps: List[datetime] = []
        self.amounts: List[float] = []
        self.promos: List[int] = []
        self.devices: List[str] = []
        self.ips: List[str] = []
        self.payments: List[str] = []
        self.addresses: List[str] = []

    def append(self, dt: datetime, amount: float, promo: int, dev: str, ip: str, pmt: str, addr: str):
        self.timestamps.append(dt)
        self.amounts.append(amount)
        self.promos.append(promo)
        self.devices.append(dev)
        self.ips.append(ip)
        self.payments.append(pmt)
        self.addresses.append(addr)


class PointInTimeBehavioralEngine:
    """
    Incremental behavioral feature extractor maintaining point-in-time user state.
    """

    def __init__(self, users_df: Optional[Any] = None):
        # Map user_id -> (signup_datetime, email_domain)
        self.user_profiles: Dict[str, Dict[str, Any]] = {}
        if users_df is not None:
            self.load_users(users_df)

        # Map user_id -> UserHistoryRecord
        self.user_histories: Dict[str, UserHistoryRecord] = {}

    def load_users(self, users_df: Any):
        """Loads user signup metadata for age and email domain lookups."""
        for _, row in users_df.iterrows():
            u_id = str(row["user_id"])
            signup_dt = datetime.strptime(str(row["signup_timestamp"]), "%Y-%m-%d %H:%M:%S")
            self.user_profiles[u_id] = {
                "signup_datetime": signup_dt,
                "email_domain": str(row.get("email_domain", "unknown")),
            }

    def extract_features(self, tx: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extracts point-in-time behavioral features for transaction tx at t_pred.
        CRITICAL: Does NOT modify internal history state.
        """
        t_pred = datetime.strptime(str(tx["timestamp"]), "%Y-%m-%d %H:%M:%S")
        user_id = str(tx["user_id"])
        amount = float(tx["amount"])

        # 1. Current Checkout Payload Features
        category = str(tx.get("product_category", "unknown"))
        is_promo = int(tx.get("is_promo_used", 0))
        shipping_addr = str(tx.get("shipping_address_id", ""))
        billing_addr = str(tx.get("billing_address_id", ""))
        billing_shipping_match = 1 if (shipping_addr and shipping_addr == billing_addr) else 0

        hour_of_day = t_pred.hour
        day_of_week = t_pred.weekday()
        is_weekend = 1 if day_of_week in [5, 6] else 0

        # Account age at checkout (days)
        profile = self.user_profiles.get(user_id)
        if profile is not None:
            signup_dt = profile["signup_datetime"]
            account_age_days = max(0.0, (t_pred - signup_dt).total_seconds() / 86400.0)
            email_domain = profile["email_domain"]
        else:
            account_age_days = 0.0
            email_domain = "unknown"

        # 2. Historical User Features (strictly timestamp < t_pred)
        history = self.user_histories.get(user_id)
        if history is None or len(history.timestamps) == 0:
            # Cold-start defaults (0 prior transactions)
            user_tx_count_1h = 0
            user_tx_count_24h = 0
            user_tx_count_7d = 0
            user_historical_tx_count = 0
            user_historical_mean_amount = amount  # Neutral fallback
            user_historical_std_amount = 0.0
            amount_to_user_mean_ratio = 1.0       # Neutral fallback
            user_promo_rate = 0.0
            user_unique_device_count = 0
            user_unique_ip_count = 0
            user_unique_payment_count = 0
            user_unique_address_count = 0
        else:
            # Window boundaries
            t_1h = t_pred - timedelta(hours=1)
            t_24h = t_pred - timedelta(hours=24)
            t_7d = t_pred - timedelta(days=7)

            ts_list = history.timestamps
            amt_list = history.amounts
            promo_list = history.promos

            # Velocity counts (strictly t_event < t_pred)
            # Since events were committed in chronological order, all ts in ts_list satisfy ts < t_pred
            count_1h = 0
            count_24h = 0
            count_7d = 0

            # Scan backwards from most recent historical event
            for ts in reversed(ts_list):
                if ts >= t_1h:
                    count_1h += 1
                if ts >= t_24h:
                    count_24h += 1
                if ts >= t_7d:
                    count_7d += 1
                else:
                    # Past 7 days, older events can't be in 1h or 24h
                    break

            user_tx_count_1h = count_1h
            user_tx_count_24h = count_24h
            user_tx_count_7d = count_7d
            user_historical_tx_count = len(ts_list)

            # Historical Amount Aggregations
            arr_amts = np.array(amt_list, dtype=np.float64)
            user_historical_mean_amount = float(np.mean(arr_amts))
            user_historical_std_amount = float(np.std(arr_amts)) if len(arr_amts) > 1 else 0.0
            amount_to_user_mean_ratio = amount / (user_historical_mean_amount + 1e-5)

            # Promo usage rate
            user_promo_rate = float(np.mean(promo_list))

            # Entity variety counts
            user_unique_device_count = len(set(history.devices))
            user_unique_ip_count = len(set(history.ips))
            user_unique_payment_count = len(set(history.payments))
            user_unique_address_count = len(set(history.addresses))

        return {
            # Observable Checkout Payload
            "amount": amount,
            "product_category": category,
            "is_promo_used": is_promo,
            "hour_of_day": hour_of_day,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "billing_shipping_match": billing_shipping_match,
            "account_age_days": round(account_age_days, 4),
            "email_domain": email_domain,
            # Point-in-Time Historical Behavior
            "user_tx_count_1h": user_tx_count_1h,
            "user_tx_count_24h": user_tx_count_24h,
            "user_tx_count_7d": user_tx_count_7d,
            "user_historical_tx_count": user_historical_tx_count,
            "user_historical_mean_amount": round(user_historical_mean_amount, 2),
            "user_historical_std_amount": round(user_historical_std_amount, 2),
            "amount_to_user_mean_ratio": round(amount_to_user_mean_ratio, 4),
            "user_promo_rate": round(user_promo_rate, 4),
            "user_unique_device_count": user_unique_device_count,
            "user_unique_ip_count": user_unique_ip_count,
            "user_unique_payment_count": user_unique_payment_count,
            "user_unique_address_count": user_unique_address_count,
        }

    def commit_transaction(self, tx: Dict[str, Any]):
        """
        Commits transaction tx into user history state.
        MUST ONLY be called AFTER extract_features() for transaction tx.
        """
        user_id = str(tx["user_id"])
        t_pred = datetime.strptime(str(tx["timestamp"]), "%Y-%m-%d %H:%M:%S")
        amount = float(tx["amount"])
        promo = int(tx.get("is_promo_used", 0))
        dev = str(tx.get("device_id", ""))
        ip = str(tx.get("ip_address", ""))
        pmt = str(tx.get("payment_instrument_id", ""))
        addr = str(tx.get("shipping_address_id", ""))

        if user_id not in self.user_histories:
            self.user_histories[user_id] = UserHistoryRecord()

        self.user_histories[user_id].append(
            dt=t_pred,
            amount=amount,
            promo=promo,
            dev=dev,
            ip=ip,
            pmt=pmt,
            addr=addr,
        )
