"""
Reason Code Definitions and Descriptions.

Human-readable, explainable reason codes derived strictly from observable features.
Ground-truth labels and ring identifiers are strictly excluded from reason logic.
"""

from typing import Dict, Any, NamedTuple


class ReasonCodeDef(NamedTuple):
    code: str
    message: str
    category: str


REASON_CODE_REGISTRY: Dict[str, ReasonCodeDef] = {
    "GRAPH_CONNECTED_USERS": ReasonCodeDef(
        code="GRAPH_CONNECTED_USERS",
        message="Transaction belongs to a highly connected account cluster in the entity graph.",
        category="GRAPH",
    ),
    "GRAPH_SHARED_DEVICE": ReasonCodeDef(
        code="GRAPH_SHARED_DEVICE",
        message="Device fingerprint is associated with multiple distinct user accounts.",
        category="GRAPH",
    ),
    "GRAPH_SHARED_PAYMENT": ReasonCodeDef(
        code="GRAPH_SHARED_PAYMENT",
        message="Payment instrument is associated with multiple distinct user accounts.",
        category="GRAPH",
    ),
    "GRAPH_SHARED_ADDRESS": ReasonCodeDef(
        code="GRAPH_SHARED_ADDRESS",
        message="Shipping address is associated with multiple distinct user accounts.",
        category="GRAPH",
    ),
    "GRAPH_MULTI_ENTITY_OVERLAP": ReasonCodeDef(
        code="GRAPH_MULTI_ENTITY_OVERLAP",
        message="Multiple entity infrastructure types are shared across accounts.",
        category="GRAPH",
    ),
    "HIGH_24H_VELOCITY": ReasonCodeDef(
        code="HIGH_24H_VELOCITY",
        message="Account has unusually high transaction activity in the last 24 hours.",
        category="BEHAVIORAL",
    ),
    "HIGH_1H_VELOCITY": ReasonCodeDef(
        code="HIGH_1H_VELOCITY",
        message="Account has unusually high transaction velocity in the last hour.",
        category="BEHAVIORAL",
    ),
    "NEW_ACCOUNT": ReasonCodeDef(
        code="NEW_ACCOUNT",
        message="Account was recently created and has minimal prior tenure.",
        category="BEHAVIORAL",
    ),
    "DISPOSABLE_EMAIL_DOMAIN": ReasonCodeDef(
        code="DISPOSABLE_EMAIL_DOMAIN",
        message="Account registered with a temporary or disposable email service.",
        category="BEHAVIORAL",
    ),
    "PROMO_ACTIVITY": ReasonCodeDef(
        code="PROMO_ACTIVITY",
        message="Transaction applies a promotional voucher or discount code.",
        category="BEHAVIORAL",
    ),
    "OFF_HOURS_ACTIVITY": ReasonCodeDef(
        code="OFF_HOURS_ACTIVITY",
        message="Transaction initiated during an unusual overnight activity window (01:00-06:00).",
        category="BEHAVIORAL",
    ),
    "HIGH_AMOUNT_ANOMALY": ReasonCodeDef(
        code="HIGH_AMOUNT_ANOMALY",
        message="Transaction amount deviates significantly from the user's personal spending average.",
        category="BEHAVIORAL",
    ),
    "MULTIPLE_DEVICES": ReasonCodeDef(
        code="MULTIPLE_DEVICES",
        message="Account has rapidly switched between multiple client devices.",
        category="BEHAVIORAL",
    ),
    "MULTIPLE_IPS": ReasonCodeDef(
        code="MULTIPLE_IPS",
        message="Account has transacted from multiple distinct IP addresses.",
        category="BEHAVIORAL",
    ),
    "LOW_RISK_ESTABLISHED_ACCOUNT": ReasonCodeDef(
        code="LOW_RISK_ESTABLISHED_ACCOUNT",
        message="Account tenure and transaction history indicate normal, established customer behavior.",
        category="BENIGN",
    ),
}
