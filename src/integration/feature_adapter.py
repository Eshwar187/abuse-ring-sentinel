"""
Feature Adapter: Raw Canonical Transaction -> 33 Point-in-Time Features.

Bridges incoming merchant checkout events with the persistent RuntimeStateStore
to derive the exact 33 COMBINED_FEATURES contract required by Model F (HistGradientBoosting).
"""

from __future__ import annotations
from datetime import timedelta
from typing import TYPE_CHECKING, Dict, Any, Tuple
import numpy as np

from src.integration.normalizer import CanonicalTransaction
from src.integration.schemas import DataQualityMetadata
from src.features.groups import COMBINED_FEATURES

if TYPE_CHECKING:
    from src.state.state_store import RuntimeStateStore


class FeatureAdapter:
    """
    Derives the exact 33 COMBINED_FEATURES from a raw canonical transaction and historical state.
    """

    def __init__(self, state_store: RuntimeStateStore):
        self.state_store = state_store

    def extract_features(
        self,
        merchant_id: str,
        tx: CanonicalTransaction,
    ) -> Tuple[Dict[str, Any], DataQualityMetadata]:
        """
        Derives the point-in-time 33-feature dictionary and data quality indicator.
        Guaranteed: Uses ONLY historical state strictly before tx.timestamp (t < T).
        """
        t_pred = tx.timestamp

        # 1. Observable Checkout Payload Features (8)
        amount = float(tx.amount)
        product_category = tx.product_category
        is_promo_used = tx.is_promo_used
        hour_of_day = t_pred.hour
        day_of_week = t_pred.weekday()
        is_weekend = 1 if day_of_week in [5, 6] else 0
        billing_shipping_match = tx.billing_shipping_match
        email_domain = tx.email_domain

        # 2. Account Profile & Tenure Features
        profile = self.state_store.get_user_profile(merchant_id, tx.user_id)
        if profile is not None:
            signup_dt = profile["first_seen_timestamp"]
            account_age_days = max(0.0, (t_pred - signup_dt).total_seconds() / 86400.0)
            if profile.get("email_domain") and profile["email_domain"] != "unknown":
                email_domain = profile["email_domain"]
        else:
            account_age_days = 0.0

        # 3. Point-in-Time Historical Behavioral Features (strictly t < t_pred)
        history = self.state_store.get_user_transactions_before(merchant_id, tx.user_id, t_pred)
        is_cold_start = (len(history) == 0)

        if is_cold_start:
            user_tx_count_1h = 0
            user_tx_count_24h = 0
            user_tx_count_7d = 0
            user_historical_tx_count = 0
            user_historical_mean_amount = amount
            user_historical_std_amount = 0.0
            amount_to_user_mean_ratio = 1.0
            user_promo_rate = 0.0
            user_unique_device_count = 0
            user_unique_ip_count = 0
            user_unique_payment_count = 0
            user_unique_address_count = 0
        else:
            t_1h = t_pred - timedelta(hours=1)
            t_24h = t_pred - timedelta(hours=24)
            t_7d = t_pred - timedelta(days=7)

            ts_list = [h["timestamp"] for h in history]
            amt_list = [h["amount"] for h in history]
            promo_list = [h["is_promo_used"] for h in history]

            user_tx_count_1h = sum(1 for ts in ts_list if ts >= t_1h)
            user_tx_count_24h = sum(1 for ts in ts_list if ts >= t_24h)
            user_tx_count_7d = sum(1 for ts in ts_list if ts >= t_7d)
            user_historical_tx_count = len(history)

            arr_amts = np.array(amt_list, dtype=np.float64)
            user_historical_mean_amount = float(np.mean(arr_amts))
            user_historical_std_amount = float(np.std(arr_amts)) if len(arr_amts) > 1 else 0.0
            amount_to_user_mean_ratio = amount / (user_historical_mean_amount + 1e-5)
            user_promo_rate = float(np.mean(promo_list))

            user_unique_device_count = len(set(h["device_id"] for h in history if h["device_id"]))
            user_unique_ip_count = len(set(h["ip_address"] for h in history if h["ip_address"]))
            user_unique_payment_count = len(set(h["payment_method_id"] for h in history if h["payment_method_id"]))

            ship_addrs = set(h["shipping_address_id"] for h in history if h["shipping_address_id"])
            bill_addrs = set(h["billing_address_id"] for h in history if h["billing_address_id"])
            user_unique_address_count = len(ship_addrs.union(bill_addrs))

        # 4. Point-in-Time Graph Features (strictly t < t_pred)
        dev_users = self.state_store.get_entity_prior_users(merchant_id, "DEVICE", tx.device_id, t_pred)
        ip_users = self.state_store.get_entity_prior_users(merchant_id, "IP", tx.ip_address, t_pred)
        pmt_users = self.state_store.get_entity_prior_users(merchant_id, "PAYMENT", tx.payment_method_id, t_pred)
        ship_users = self.state_store.get_entity_prior_users(merchant_id, "SHIPPING_ADDR", tx.shipping_address_id, t_pred)
        bill_users = self.state_store.get_entity_prior_users(merchant_id, "BILLING_ADDR", tx.billing_address_id, t_pred)

        device_prior_user_count = len(dev_users)
        ip_prior_user_count = len(ip_users)
        payment_prior_user_count = len(pmt_users)
        shipping_address_prior_user_count = len(ship_users)
        billing_address_prior_user_count = len(bill_users)

        max_shared_entity_user_count = max(
            device_prior_user_count,
            ip_prior_user_count,
            payment_prior_user_count,
            shipping_address_prior_user_count,
            billing_address_prior_user_count,
        )

        all_linked_users = set().union(dev_users, ip_users, pmt_users, ship_users, bill_users)
        prior_co_users = all_linked_users - {tx.user_id}
        number_of_prior_connected_users = len(prior_co_users)

        shared_entity_types_count = sum([
            1 if len(dev_users) > 1 else 0,
            1 if len(ip_users) > 1 else 0,
            1 if len(pmt_users) > 1 else 0,
            1 if len(ship_users) > 1 else 0,
            1 if len(bill_users) > 1 else 0,
        ])

        # Connected component statistics in the merchant's point-in-time graph
        comp_user_count, total_nodes, total_edges, density = self.state_store.get_connected_subgraph_stats(
            merchant_id, tx.user_id, t_pred
        )

        # Assemble the exact 33 COMBINED_FEATURES contract
        features: Dict[str, Any] = {
            # Transaction Context (8)
            "amount": amount,
            "product_category": product_category,
            "is_promo_used": is_promo_used,
            "hour_of_day": hour_of_day,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "billing_shipping_match": billing_shipping_match,
            "amount_to_user_mean_ratio": amount_to_user_mean_ratio,
            # Account Profile (6)
            "account_age_days": round(account_age_days, 4),
            "email_domain": email_domain,
            "user_historical_tx_count": user_historical_tx_count,
            "user_historical_mean_amount": user_historical_mean_amount,
            "user_historical_std_amount": user_historical_std_amount,
            "user_promo_rate": user_promo_rate,
            # Velocity & Diversity (7)
            "user_tx_count_1h": user_tx_count_1h,
            "user_tx_count_24h": user_tx_count_24h,
            "user_tx_count_7d": user_tx_count_7d,
            "user_unique_device_count": user_unique_device_count,
            "user_unique_ip_count": user_unique_ip_count,
            "user_unique_payment_count": user_unique_payment_count,
            "user_unique_address_count": user_unique_address_count,
            # Shared Entity Counts (7)
            "device_prior_user_count": device_prior_user_count,
            "ip_prior_user_count": ip_prior_user_count,
            "payment_prior_user_count": payment_prior_user_count,
            "shipping_address_prior_user_count": shipping_address_prior_user_count,
            "billing_address_prior_user_count": billing_address_prior_user_count,
            "max_shared_entity_user_count": max_shared_entity_user_count,
            "shared_entity_types_count": shared_entity_types_count,
            # Graph Topology Signals (5)
            "number_of_prior_connected_users": number_of_prior_connected_users,
            "connected_component_user_count": comp_user_count,
            "connected_component_total_nodes": total_nodes,
            "connected_component_edge_count": total_edges,
            "connected_component_density": density,
        }

        assert len(features) == len(COMBINED_FEATURES) == 33, f"Feature count mismatch: {len(features)} != 33"

        data_quality = DataQualityMetadata(
            status="cold_start" if is_cold_start else "sufficient_history",
            historical_transactions=len(history),
            graph_connected_entities=len(all_linked_users),
        )

        return features, data_quality
