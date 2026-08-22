"""
Explainability and Reason Ranking Engine.

Deterministically derives top 3–5 human-readable reason codes and feature evidence
from observable point-in-time features.
Ground-truth labels and ring identifiers are strictly excluded from explanation generation.
"""

from __future__ import annotations
from typing import Dict, Any, List, Tuple
from src.explanation.reason_codes import REASON_CODE_REGISTRY


class TransactionExplainer:
    """
    Deterministic reason generator and evidence aggregator.
    """

    DISPOSABLE_EMAIL_DOMAINS = {
        "tempmail.org",
        "trashmail.com",
        "mailinator.com",
        "10minutemail.net",
        "guerrillamail.com",
        "sharklasers.com",
    }

    def explain(
        self,
        features: Dict[str, Any],
        risk_score: float,
        max_reasons: int = 5
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Generates ranked reason codes with evidence and an evidence dictionary.
        Returns:
            (reason_codes_list, evidence_summary_dict)
        """
        candidates: List[Tuple[float, str, Dict[str, Any]]] = []

        # 1. Graph Sharing Reasons
        connected_users = int(features.get("number_of_prior_connected_users", 0))
        if connected_users >= 2:
            weight = min(10.0, 2.0 * connected_users)
            candidates.append((weight, "GRAPH_CONNECTED_USERS", {"number_of_prior_connected_users": connected_users}))

        device_users = int(features.get("device_prior_user_count", 0))
        if device_users >= 2:
            weight = min(10.0, 2.5 * device_users)
            candidates.append((weight, "GRAPH_SHARED_DEVICE", {"device_prior_user_count": device_users}))

        pmt_users = int(features.get("payment_prior_user_count", 0))
        if pmt_users >= 2:
            weight = min(10.0, 3.0 * pmt_users)
            candidates.append((weight, "GRAPH_SHARED_PAYMENT", {"payment_prior_user_count": pmt_users}))

        ship_users = int(features.get("shipping_address_prior_user_count", 0))
        if ship_users >= 2:
            weight = min(8.0, 2.0 * ship_users)
            candidates.append((weight, "GRAPH_SHARED_ADDRESS", {"shipping_address_prior_user_count": ship_users}))

        shared_types = int(features.get("shared_entity_types_count", 0))
        if shared_types >= 2:
            weight = min(8.0, 2.5 * shared_types)
            candidates.append((weight, "GRAPH_MULTI_ENTITY_OVERLAP", {"shared_entity_types_count": shared_types}))

        # 2. Account Age & Identity
        age_days = float(features.get("account_age_days", 0.0))
        if age_days < 3.0:
            weight = min(9.0, 4.0 / (age_days + 0.1))
            candidates.append((weight, "NEW_ACCOUNT", {"account_age_days": round(age_days, 2)}))

        email_dom = str(features.get("email_domain", "")).lower()
        if email_dom in self.DISPOSABLE_EMAIL_DOMAINS:
            candidates.append((6.0, "DISPOSABLE_EMAIL_DOMAIN", {"email_domain": email_dom}))

        # 3. Behavioral Velocity & Patterns
        tx_24h = int(features.get("user_tx_count_24h", 0))
        if tx_24h >= 2:
            weight = min(8.0, 2.0 * tx_24h)
            candidates.append((weight, "HIGH_24H_VELOCITY", {"user_tx_count_24h": tx_24h}))

        tx_1h = int(features.get("user_tx_count_1h", 0))
        if tx_1h >= 1:
            weight = min(9.0, 3.5 * tx_1h)
            candidates.append((weight, "HIGH_1H_VELOCITY", {"user_tx_count_1h": tx_1h}))

        # 4. Promo & Amount Anomalies
        is_promo = int(features.get("is_promo_used", 0))
        promo_rate = float(features.get("user_promo_rate", 0.0))
        if is_promo == 1 and (promo_rate > 0.4 or age_days < 2.0):
            candidates.append((3.0, "PROMO_ACTIVITY", {"is_promo_used": 1, "user_promo_rate": round(promo_rate, 2)}))

        amt_ratio = float(features.get("amount_to_user_mean_ratio", 1.0))
        amt = float(features.get("amount", 0.0))
        if amt_ratio > 2.5 and amt > 100.0:
            weight = min(6.0, 1.5 * amt_ratio)
            candidates.append((weight, "HIGH_AMOUNT_ANOMALY", {"amount": amt, "amount_to_user_mean_ratio": round(amt_ratio, 2)}))

        hour = int(features.get("hour_of_day", 12))
        if hour in (1, 2, 3, 4, 5):
            candidates.append((2.0, "OFF_HOURS_ACTIVITY", {"hour_of_day": hour}))

        # Sort candidates descending by severity weight
        candidates.sort(key=lambda x: x[0], reverse=True)

        # Build output reason codes
        reason_codes: List[Dict[str, Any]] = []
        for _, code, evidence in candidates[:max_reasons]:
            reg = REASON_CODE_REGISTRY.get(code)
            msg = reg.message if reg else code
            reason_codes.append({
                "code": code,
                "message": msg,
                "evidence": evidence,
            })

        # Fallback for low-risk transactions with no adverse signals
        if not reason_codes and risk_score < 0.50:
            reg = REASON_CODE_REGISTRY["LOW_RISK_ESTABLISHED_ACCOUNT"]
            reason_codes.append({
                "code": reg.code,
                "message": reg.message,
                "evidence": {
                    "account_age_days": round(age_days, 1),
                    "user_historical_tx_count": int(features.get("user_historical_tx_count", 0)),
                }
            })

        # Comprehensive Observable Evidence Summary
        evidence_summary = {
            "account_age_days": round(age_days, 2),
            "user_tx_count_24h": tx_24h,
            "device_prior_user_count": device_users,
            "ip_prior_user_count": int(features.get("ip_prior_user_count", 0)),
            "payment_prior_user_count": pmt_users,
            "shipping_address_prior_user_count": ship_users,
            "number_of_prior_connected_users": connected_users,
            "max_shared_entity_user_count": int(features.get("max_shared_entity_user_count", 0)),
            "is_promo_used": is_promo,
            "amount": float(features.get("amount", 0.0)),
        }

        return reason_codes, evidence_summary
