"""
Audit Repository for MySQL persistence.
Stores append-only audit logs for security, policy execution, and merchant activities.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
import json
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from src.db.models import AuditEventModel


class AuditRepository:
    def __init__(self, session: Session):
        self.session = session

    def log_event(
        self,
        merchant_id: str,
        event_type: str,
        actor: str = "system",
        transaction_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditEventModel:
        now = datetime.utcnow()
        event_id = f"evt_{uuid.uuid4().hex[:16]}"
        event = AuditEventModel(
            event_id=event_id,
            merchant_id=merchant_id,
            transaction_id=transaction_id,
            event_type=event_type,
            actor=actor,
            details_json=json.dumps(details or {}),
            created_at=now,
        )
        self.session.add(event)
        return event

    def list_events(
        self,
        merchant_id: str,
        limit: int = 100,
    ) -> List[AuditEventModel]:
        stmt = select(AuditEventModel).where(
            AuditEventModel.merchant_id == merchant_id
        ).order_by(desc(AuditEventModel.created_at)).limit(limit)
        return list(self.session.scalars(stmt).all())
