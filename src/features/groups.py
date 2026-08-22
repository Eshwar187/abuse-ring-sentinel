"""
Feature Groups Definition for Abuse-Ring Sentinel.

Defines immutable, explicit feature partitions for controlled ablation studies:
- GROUP A: Behavioral & Account Features (21 features)
- GROUP B: Graph & Relational Features (12 features)
- GROUP C: Combined Features (33 features)
- GROUP D: Combined without account_age_days (32 features)
- GROUP E: Combined without account_age_days and email_domain (31 features)
"""

from typing import List

# Metadata / identifiers that must NEVER be model features
METADATA_COLUMNS: List[str] = [
    "transaction_id",
    "timestamp",
    "is_abuse_ring",
    "ring_id",
    "ring_type",
    "user_population_type",
    "order_status",
]

# GROUP A: Behavioral and Account-level Features
BEHAVIORAL_FEATURES: List[str] = [
    "amount",
    "product_category",
    "is_promo_used",
    "hour_of_day",
    "day_of_week",
    "is_weekend",
    "billing_shipping_match",
    "account_age_days",
    "email_domain",
    "user_tx_count_1h",
    "user_tx_count_24h",
    "user_tx_count_7d",
    "user_historical_tx_count",
    "user_historical_mean_amount",
    "user_historical_std_amount",
    "amount_to_user_mean_ratio",
    "user_promo_rate",
    "user_unique_device_count",
    "user_unique_ip_count",
    "user_unique_payment_count",
    "user_unique_address_count",
]

# GROUP B: Graph and Relational Features
GRAPH_FEATURES: List[str] = [
    "device_prior_user_count",
    "ip_prior_user_count",
    "payment_prior_user_count",
    "shipping_address_prior_user_count",
    "billing_address_prior_user_count",
    "max_shared_entity_user_count",
    "number_of_prior_connected_users",
    "shared_entity_types_count",
    "connected_component_user_count",
    "connected_component_total_nodes",
    "connected_component_edge_count",
    "connected_component_density",
]

# GROUP C: Combined Features (Behavioral + Graph)
COMBINED_FEATURES: List[str] = BEHAVIORAL_FEATURES + GRAPH_FEATURES

# GROUP D: Shortcut Ablation 1 (Combined without account_age_days)
NO_AGE_FEATURES: List[str] = [f for f in COMBINED_FEATURES if f != "account_age_days"]

# GROUP E: Shortcut Ablation 2 (Combined without account_age_days and email_domain)
NO_AGE_NO_EMAIL_FEATURES: List[str] = [
    f for f in COMBINED_FEATURES if f not in ("account_age_days", "email_domain")
]

# Categorical column identifiers
CATEGORICAL_FEATURES: List[str] = ["product_category", "email_domain"]
