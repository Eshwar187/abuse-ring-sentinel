"""
Transaction Repository for MySQL persistence.
Enforces point-in-time querying (strictly timestamp < T) and tenant isolation.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Tuple
import math
import json
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, desc

from src.db.models import TransactionModel, UserModel


class TransactionRepository:
    def __init__(self, session: Session):
        self.session = session

    def save_transaction(
        self,
        merchant_id: str,
        transaction_id: str,
        user_id: str,
        amount: float,
        currency: str,
        timestamp: datetime,
        product_category: Optional[str] = None,
        device_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        payment_method_id: Optional[str] = None,
        shipping_address_id: Optional[str] = None,
        billing_address_id: Optional[str] = None,
        email_domain: Optional[str] = None,
        promo_code: Optional[str] = None,
        raw_payload_json: Optional[str] = None,
    ) -> TransactionModel:
        """Persists canonical transaction record in MySQL."""
        now = datetime.utcnow()
        tx = TransactionModel(
            transaction_id=transaction_id,
            merchant_id=merchant_id,
            user_id=user_id,
            amount=amount,
            currency=currency,
            timestamp=timestamp,
            product_category=product_category,
            device_id=device_id,
            ip_address=ip_address,
            payment_method_id=payment_method_id,
            shipping_address_id=shipping_address_id,
            billing_address_id=billing_address_id,
            email_domain=email_domain,
            promo_code=promo_code,
            raw_payload_json=raw_payload_json,
            created_at=now,
        )
        self.session.add(tx)

        # Update or create User summary record in MySQL
        stmt = select(UserModel).where(UserModel.merchant_id == merchant_id, UserModel.user_id == user_id)
        user = self.session.scalar(stmt)
        if not user:
            user = UserModel(
                merchant_id=merchant_id,
                user_id=user_id,
                first_seen_at=timestamp,
                last_seen_at=timestamp,
                account_age_days=0.0,
                tx_count=1,
                total_amount=amount,
                promo_count=1 if promo_code else 0,
                email_domain=email_domain,
                created_at=now,
                updated_at=now,
            )
            self.session.add(user)
        else:
            if timestamp < user.first_seen_at:
                user.first_seen_at = timestamp
            if timestamp > user.last_seen_at:
                user.last_seen_at = timestamp
            user.tx_count += 1
            user.total_amount += amount
            if promo_code:
                user.promo_count += 1
            user.account_age_days = max(0.0, (user.last_seen_at - user.first_seen_at).total_seconds() / 86400.0)
            user.updated_at = now

        return tx

    def get_transaction(self, merchant_id: str, transaction_id: str) -> Optional[TransactionModel]:
        stmt = select(TransactionModel).where(
            TransactionModel.merchant_id == merchant_id,
            TransactionModel.transaction_id == transaction_id,
        )
        return self.session.scalar(stmt)

    def get_prior_user_transactions(
        self,
        merchant_id: str,
        user_id: str,
        before_timestamp: datetime,
    ) -> List[TransactionModel]:
        """
        Point-in-time query: Returns transactions for a user strictly BEFORE timestamp T.
        Excludes current transaction (timestamp == T) and future events (timestamp > T).
        """
        stmt = select(TransactionModel).where(
            TransactionModel.merchant_id == merchant_id,
            TransactionModel.user_id == user_id,
            TransactionModel.timestamp < before_timestamp,
        ).order_by(desc(TransactionModel.timestamp))
        return list(self.session.scalars(stmt).all())

    def get_user_point_in_time_metrics(
        self,
        merchant_id: str,
        user_id: str,
        before_timestamp: datetime,
        current_amount: float,
        is_promo_used: int,
    ) -> Dict[str, Any]:
        """
        Calculates exact historical behavioral velocity features strictly before timestamp T.
        """
        prior_txs = self.get_prior_user_transactions(merchant_id, user_id, before_timestamp)
        n_prior = len(prior_txs)

        if n_prior == 0:
            return {
                "account_age_days": 0.0,
                "user_historical_tx_count": 0,
                "user_historical_mean_amount": float(current_amount),
                "user_historical_std_amount": 0.0,
                "amount_to_user_mean_ratio": 1.0,
                "user_promo_rate": float(is_promo_used),
                "user_tx_count_1h": 0,
                "user_tx_count_24h": 0,
                "user_tx_count_7d": 0,
            }

        # First seen timestamp in prior transactions
        first_ts = min(tx.timestamp for tx in prior_txs)
        account_age_days = max(0.0, (before_timestamp - first_ts).total_seconds() / 86400.0)

        t_1h = before_timestamp - timedelta(hours=1)
        t_24h = before_timestamp - timedelta(hours=24)
        t_7d = before_timestamp - timedelta(days=7)

        count_1h = sum(1 for tx in prior_txs if tx.timestamp >= t_1h)
        count_24h = sum(1 for tx in prior_txs if tx.timestamp >= t_24h)
        count_7d = sum(1 for tx in prior_txs if tx.timestamp >= t_7d)

        amounts = [tx.amount for tx in prior_txs]
        mean_amt = sum(amounts) / n_prior
        variance = sum((x - mean_amt) ** 2 for x in amounts) / n_prior
        std_amt = math.sqrt(variance)

        mean_ratio = float(current_amount / mean_amt) if mean_amt > 0 else 1.0
        promo_count = sum(1 for tx in prior_txs if tx.promo_code)
        promo_rate = float(promo_count / n_prior)

        return {
            "account_age_days": account_age_days,
            "user_historical_tx_count": n_prior,
            "user_historical_mean_amount": mean_amt,
            "user_historical_std_amount": std_amt,
            "amount_to_user_mean_ratio": mean_ratio,
            "user_promo_rate": promo_rate,
            "user_tx_count_1h": count_1h,
            "user_tx_count_24h": count_24h,
            "user_tx_count_7d": count_7d,
        }

    def list_merchant_transactions(
        self,
        merchant_id: str,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[TransactionModel], int]:
        """Returns paginated transactions scoped to merchant."""
        query = select(TransactionModel).where(TransactionModel.merchant_id == merchant_id)
        count_query = select(func.count(TransactionModel.transaction_id)).where(TransactionModel.merchant_id == merchant_id)

        if search:
            search_pattern = f"%{search}%"
            filter_cond = (
                TransactionModel.transaction_id.like(search_pattern)
                | TransactionModel.user_id.like(search_pattern)
                | TransactionModel.ip_address.like(search_pattern)
            )
            query = query.where(filter_cond)
            count_query = count_query.where(filter_cond)

        total_count = self.session.scalar(count_query) or 0
        offset = (page - 1) * page_size
        stmt = query.order_by(desc(TransactionModel.timestamp)).offset(offset).limit(page_size)
        items = list(self.session.scalars(stmt).all())

        return items, total_count
