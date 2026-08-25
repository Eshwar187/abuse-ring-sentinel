"""
Outcome Repository for MySQL persistence.
Stores ground-truth fraud labels and chargeback resolutions.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from src.db.models import OutcomeModel


class OutcomeRepository:
    def __init__(self, session: Session):
        self.session = session

    def save_outcome(
        self,
        merchant_id: str,
        transaction_id: str,
        outcome: str,
        notes: Optional[str] = None,
        outcome_timestamp: Optional[datetime] = None,
    ) -> OutcomeModel:
        now = datetime.utcnow()
        stmt = select(OutcomeModel).where(
            OutcomeModel.merchant_id == merchant_id,
            OutcomeModel.transaction_id == transaction_id,
        )
        rec = self.session.scalar(stmt)
        if not rec:
            rec = OutcomeModel(
                transaction_id=transaction_id,
                merchant_id=merchant_id,
                outcome=outcome,
                notes=notes,
                outcome_timestamp=outcome_timestamp or now,
                recorded_at=now,
            )
            self.session.add(rec)
        else:
            rec.outcome = outcome
            rec.notes = notes
            rec.outcome_timestamp = outcome_timestamp or rec.outcome_timestamp
            rec.recorded_at = now
        return rec

    def get_outcome(self, merchant_id: str, transaction_id: str) -> Optional[OutcomeModel]:
        stmt = select(OutcomeModel).where(
            OutcomeModel.merchant_id == merchant_id,
            OutcomeModel.transaction_id == transaction_id,
        )
        return self.session.scalar(stmt)
