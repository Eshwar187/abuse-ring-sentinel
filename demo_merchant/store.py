"""
Real SQLite Order Store for Local Demo Merchant.
Tracks genuine order lifecycle: PENDING -> APPROVED | UNDER_REVIEW | BLOCKED | CANCELLED.
"""

from __future__ import annotations
import os
import sqlite3
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


DEFAULT_MERCHANT_DB = "demo_merchant/orders.db"


class DemoMerchantOrderStore:
    """
    SQLite backed real order persistence for the local demo merchant backend.
    """

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or DEFAULT_MERCHANT_DB
        self._memory_conn = None
        if self.db_path != ":memory:":
            os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        else:
            self._memory_conn = sqlite3.connect(":memory:", check_same_thread=False)
            self._memory_conn.row_factory = sqlite3.Row

        self._init_sqlite()

    def _get_connection(self) -> sqlite3.Connection:
        if self._memory_conn is not None:
            return self._memory_conn
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS merchant_orders (
                    order_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    amount REAL NOT NULL,
                    currency TEXT NOT NULL,
                    status TEXT NOT NULL,
                    risk_action_received TEXT,
                    risk_score REAL,
                    notes TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            conn.commit()

    def create_order(self, order_id: str, user_id: str, amount: float, currency: str = "INR") -> Dict[str, Any]:
        now_str = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO merchant_orders (
                    order_id, user_id, amount, currency, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)
                ON CONFLICT(order_id) DO UPDATE SET
                    user_id = excluded.user_id,
                    amount = excluded.amount,
                    currency = excluded.currency,
                    updated_at = excluded.updated_at
                """,
                (order_id, user_id, amount, currency, now_str, now_str),
            )
            conn.commit()

        return self.get_order(order_id)

    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM merchant_orders WHERE order_id = ?", (order_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def update_order_risk_action(
        self,
        order_id: str,
        action: str,
        risk_score: Optional[float] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Updates real order state based on Sentinel risk action:
        - BLOCK_TRANSACTION -> BLOCKED
        - APPROVE_TRANSACTION -> APPROVED
        - REVIEW_TRANSACTION -> UNDER_REVIEW
        """
        now_str = datetime.now(timezone.utc).isoformat()
        new_status = "PENDING"
        if action == "BLOCK_TRANSACTION":
            new_status = "BLOCKED"
        elif action == "APPROVE_TRANSACTION":
            new_status = "APPROVED"
        elif action == "REVIEW_TRANSACTION":
            new_status = "UNDER_REVIEW"

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE merchant_orders
                SET status = ?, risk_action_received = ?, risk_score = ?, notes = ?, updated_at = ?
                WHERE order_id = ?
                """,
                (new_status, action, risk_score, notes, now_str, order_id),
            )
            if cursor.rowcount == 0:
                # If order wasn't created prior, insert record with new status
                cursor.execute(
                    """
                    INSERT INTO merchant_orders (
                        order_id, user_id, amount, currency, status, risk_action_received, risk_score, notes, created_at, updated_at
                    ) VALUES (?, 'system_derived', 0.0, 'INR', ?, ?, ?, ?, ?, ?)
                    """,
                    (order_id, new_status, action, risk_score, notes, now_str, now_str),
                )
            conn.commit()

        return self.get_order(order_id)

    def list_orders(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM merchant_orders ORDER BY created_at DESC LIMIT ?", (limit,))
            return [dict(r) for r in cursor.fetchall()]
