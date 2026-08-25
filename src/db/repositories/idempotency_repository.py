"""
Idempotency Repository for MySQL persistence.
Enforces unique (merchant_id, idempotency_key) constraints.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any
import json
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.db.models import IdempotencyRecordModel


class IdempotencyRepository:
    def __init__(self, session: Session):
        self.session = session

    def save_idempotency_record(
        self,
        merchant_id: str,
        idempotency_key: str,
        transaction_id: str,
        response_hash: str,
        response_data: Dict[str, Any],
        expires_at: Optional[datetime] = None,
    ) -> IdempotencyRecordModel:
        now = datetime.utcnow()
        rec = IdempotencyRecordModel(
            merchant_id=merchant_id,
            idempotency_key=idempotency_key,
            transaction_id=transaction_id,
            response_hash=response_hash,
            response_json=json.dumps(response_data),
            created_at=now,
            expires_at=expires_at,
        )
        self.session.add(rec)
        return rec

    def get_idempotency_record(
        self,
        merchant_id: str,
        idempotency_key: str,
    ) -> Optional[IdempotencyRecordModel]:
        stmt = select(IdempotencyRecordModel).where(
            IdempotencyRecordModel.merchant_id == merchant_id,
            IdempotencyRecordModel.idempotency_key == idempotency_key,
        )
        return self.session.scalar(stmt)
