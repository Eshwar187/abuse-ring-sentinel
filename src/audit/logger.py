"""
Structured Audit Logging.

Records risk evaluations for regulatory compliance, post-decision reviews,
and merchant operations audits without logging sensitive PII or ground truth.
"""

from __future__ import annotations
import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List


class AuditLogger:
    """
    Structured JSON Lines audit logger for risk transactions.
    """

    def __init__(self, log_path: Optional[str] = "reports/audit_log.jsonl"):
        self.log_path = log_path
        if self.log_path:
            os.makedirs(os.path.dirname(self.log_path) or ".", exist_ok=True)

    def format_log_entry(self, decision_result: Dict[str, Any]) -> Dict[str, Any]:
        """Formats clean audit record from decision result."""
        # Extract code names only for compact logging
        reason_codes = [
            r["code"] if isinstance(r, dict) else str(r)
            for r in decision_result.get("reason_codes", [])
        ]
        meta = decision_result.get("model_metadata", {})

        entry = {
            "transaction_id": decision_result.get("transaction_id"),
            "timestamp": decision_result.get("evaluated_at") or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "risk_score": decision_result.get("risk_score"),
            "risk_level": decision_result.get("risk_level"),
            "decision": decision_result.get("decision"),
            "reason_codes": reason_codes,
            "model_version": meta.get("model_version", "unknown"),
            "feature_version": meta.get("feature_version", "unknown"),
            "policy_version": meta.get("policy_version", "unknown"),
        }
        return entry

    def log(self, decision_result: Dict[str, Any]) -> Dict[str, Any]:
        """Appends formatted entry to the audit log file."""
        entry = self.format_log_entry(decision_result)
        if self.log_path:
            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
        return entry
