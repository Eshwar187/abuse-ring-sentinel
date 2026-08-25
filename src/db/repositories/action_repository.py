"""
Action Repository for MySQL persistence.
Tracks outbound merchant actions and retry attempts.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
import json
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from src.db.models import MerchantActionModel, ActionAttemptModel


class ActionRepository:
    def __init__(self, session: Session):
        self.session = session

    def record_action_attempt(
        self,
        action_id: str,
        merchant_id: str,
        transaction_id: str,
        decision: str,
        action: str,
        attempt_number: int,
        status: str,
        http_status: Optional[int] = None,
        merchant_reference: Optional[str] = None,
        merchant_message: Optional[str] = None,
        latency_ms: Optional[float] = None,
        payload_json: Optional[str] = None,
        response_json: Optional[str] = None,
        created_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
    ) -> MerchantActionModel:
        now = datetime.utcnow()
        stmt = select(MerchantActionModel).where(MerchantActionModel.action_id == action_id)
        action_rec = self.session.scalar(stmt)

        if not action_rec:
            action_rec = MerchantActionModel(
                action_id=action_id,
                merchant_id=merchant_id,
                transaction_id=transaction_id,
                decision=decision,
                action=action,
                status=status,
                http_status=http_status,
                merchant_reference=merchant_reference,
                merchant_message=merchant_message,
                latency_ms=latency_ms or 0.0,
                attempt_number=attempt_number,
                payload_json=payload_json,
                response_json=response_json,
                created_at=created_at or now,
                completed_at=completed_at or now,
            )
            self.session.add(action_rec)
        else:
            action_rec.status = status
            action_rec.http_status = http_status
            action_rec.merchant_reference = merchant_reference
            action_rec.merchant_message = merchant_message
            action_rec.latency_ms = latency_ms or action_rec.latency_ms
            action_rec.attempt_number = attempt_number
            if payload_json:
                action_rec.payload_json = payload_json
            if response_json:
                action_rec.response_json = response_json
            action_rec.completed_at = completed_at or now

        # Add attempt log
        attempt = ActionAttemptModel(
            action_id=action_id,
            merchant_id=merchant_id,
            attempt_number=attempt_number,
            status=status,
            http_status=http_status,
            error_detail=merchant_message if status in ("FAILED", "TIMEOUT") else None,
            latency_ms=latency_ms or 0.0,
            created_at=now,
        )
        self.session.add(attempt)

        return action_rec

    def get_action_by_id(self, action_id: str) -> Optional[MerchantActionModel]:
        stmt = select(MerchantActionModel).where(MerchantActionModel.action_id == action_id)
        return self.session.scalar(stmt)

    def get_action_by_tx(self, merchant_id: str, transaction_id: str) -> Optional[MerchantActionModel]:
        stmt = select(MerchantActionModel).where(
            MerchantActionModel.merchant_id == merchant_id,
            MerchantActionModel.transaction_id == transaction_id,
        ).order_by(desc(MerchantActionModel.created_at))
        return self.session.scalar(stmt)

    def list_actions(
        self,
        merchant_id: str,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[MerchantActionModel], int]:
        query = select(MerchantActionModel).where(MerchantActionModel.merchant_id == merchant_id)
        count_query = select(func.count(MerchantActionModel.action_id)).where(MerchantActionModel.merchant_id == merchant_id)

        if status:
            query = query.where(MerchantActionModel.status == status)
            count_query = count_query.where(MerchantActionModel.status == status)

        total_count = self.session.scalar(count_query) or 0
        offset = (page - 1) * page_size
        stmt = query.order_by(desc(MerchantActionModel.created_at)).offset(offset).limit(page_size)
        items = list(self.session.scalars(stmt).all())

        return items, total_count
