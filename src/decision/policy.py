"""
Risk Decision Policy.

Encapsulates threshold rules and risk level mappings selected during Validation:
- score < 0.50        -> APPROVE (LOW risk)
- 0.50 <= score < 0.90 -> REVIEW / STEP-UP VERIFICATION (MEDIUM risk)
- score >= 0.90       -> BLOCK (HIGH risk)
"""

from enum import Enum
from dataclasses import dataclass
from typing import Tuple


class RiskDecision(str, Enum):
    APPROVE = "APPROVE"
    REVIEW = "REVIEW"
    BLOCK = "BLOCK"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


@dataclass(frozen=True)
class DecisionPolicy:
    """
    Centralized threshold configuration for merchant risk decisions.
    """
    review_threshold: float = 0.50
    block_threshold: float = 0.90
    policy_version: str = "val-opt-v1"

    def evaluate(self, risk_score: float) -> Tuple[RiskDecision, RiskLevel]:
        """
        Maps continuous risk_score in [0, 1] into a discrete merchant action and risk level.
        """
        score = float(risk_score)
        if score < self.review_threshold:
            return RiskDecision.APPROVE, RiskLevel.LOW
        elif score < self.block_threshold:
            return RiskDecision.REVIEW, RiskLevel.MEDIUM
        else:
            return RiskDecision.BLOCK, RiskLevel.HIGH
