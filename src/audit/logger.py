"""
Structured Audit Logging for Abuse-Ring Sentinel.

Records risk evaluations for regulatory compliance, post-decision reviews,
and merchant operations audits without logging sensitive PII, passwords,
payment PANs, CVVs, or ground-truth labels.
"""

from __future__ import annotations
import os
import re
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List


class AuditLogger:
    """
    Structured JSON Lines audit logger for risk transactions.
    """

    FORBIDDEN_AUDIT_KEYS = {
        "password",
        "secret",
        "token",
        "pan",
        "cvv",
        "credit_card",
        "ssn",
        "auth_header",
    }

    # Mask potential 13-19 digit card numbers if accidentally passed
    PAN_PATTERN = re.compile(r"\b(?:\d[ -]*?){13,19}\b")

    def __init__(self, log_path: Optional[str] = "reports/audit_log.jsonl"):
        self.log_path = log_path
        if self.log_path:
            os.makedirs(os.path.dirname(self.log_path) or ".", exist_ok=True)

    def _sanitize_value(self, val: Any) -> Any:
        if isinstance(val, str):
            if self.PAN_PATTERN.search(val):
                return "[REDACTED_CARD_NUMBER]"
            return val
        elif isinstance(val, dict):
            return {
                k: self._sanitize_value(v)
                for k, v in val.items()
                if k.lower() not in self.FORBIDDEN_AUDIT_KEYS
            }
        elif isinstance(val, list):
            return [self._sanitize_value(item) for item in val]
        return val

    def format_log_entry(
        self,
        decision_result: Dict[str, Any],
        request_id: Optional[str] = None,
        latency_ms: Optional[float] = None
    ) -> Dict[str, Any]:
        """Formats clean, sanitized audit record from decision result."""
        reason_codes = [
            r["code"] if isinstance(r, dict) else str(r)
            for r in decision_result.get("reason_codes", [])
        ]
        meta = decision_result.get("model_metadata", {})

        entry = {
            "request_id": request_id or str(uuid.uuid4()),
            "transaction_id": str(decision_result.get("transaction_id", "unknown")),
            "timestamp": decision_result.get("evaluated_at") or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "risk_score": decision_result.get("risk_score"),
            "risk_level": str(decision_result.get("risk_level", "UNKNOWN")),
            "decision": str(decision_result.get("decision", "UNKNOWN")),
            "reason_codes": reason_codes,
            "model_version": str(meta.get("model_version", "unknown")),
            "feature_version": str(meta.get("feature_version", "unknown")),
            "policy_version": str(meta.get("policy_version", "unknown")),
            "latency_ms": round(float(latency_ms), 2) if latency_ms is not None else None,
        }
        return self._sanitize_value(entry)

    def log(
        self,
        decision_result: Dict[str, Any],
        request_id: Optional[str] = None,
        latency_ms: Optional[float] = None
    ) -> Dict[str, Any]:
        """Appends formatted entry to the audit log file."""
        entry = self.format_log_entry(decision_result, request_id=request_id, latency_ms=latency_ms)
        if self.log_path:
            try:
                with open(self.log_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(entry) + "\n")
            except IOError as e:
                # Fallback to stderr without crashing the critical inference path
                import sys
                print(f"[AUDIT LOG WRITE ERROR]: {e}", file=sys.stderr)
        return entry
