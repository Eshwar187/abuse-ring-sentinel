"""
Persistent Runtime State Store with Strict Merchant Isolation.

Maintains:
- Merchant-scoped transaction history in SQLite (data/runtime/runtime_state.db)
- Point-in-time entity relationship graphs (NetworkX) with timestamped edges
- User tenure profiles
- Idempotency records for replay prevention
- Asynchronous lifecycle event records and outcome feedback

Strictly enforces:
1. Merchant Isolation: Merchant A data NEVER contaminates Merchant B.
2. Point-in-Time Causality: For transaction at timestamp T, only events with t < T are returned.
"""

from __future__ import annotations
import os
import json
import sqlite3
from datetime import datetime
from typing import Dict, Any, List, Set, Tuple, Optional
from collections import defaultdict
import networkx as nx

from src.integration.normalizer import CanonicalTransaction
from src.integration.schemas import OutcomePayload, MerchantEventPayload


DEFAULT_DB_PATH = "data/runtime/runtime_state.db"


class RuntimeStateStore:
    """
    Thread-safe, merchant-partitioned persistent runtime state store.
    """

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or DEFAULT_DB_PATH
        self._memory_conn = None
        if self.db_path != ":memory:":
            os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        else:
            self._memory_conn = sqlite3.connect(":memory:", check_same_thread=False)
            self._memory_conn.row_factory = sqlite3.Row

        # In-memory point-in-time entity graphs per merchant: merchant_id -> nx.Graph
        # Edge attribute: 'timestamp' (datetime)
        self.merchant_graphs: Dict[str, nx.Graph] = defaultdict(nx.Graph)

        self._init_sqlite()
        self._hydrate_graphs_from_db()

    def _get_connection(self) -> sqlite3.Connection:
        if self._memory_conn is not None:
            return self._memory_conn
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self):
        """Initializes database schema with merchant_id partition keys."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # 1. Transactions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS runtime_transactions (
                    merchant_id TEXT NOT NULL,
                    transaction_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    amount REAL NOT NULL,
                    currency TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    product_category TEXT,
                    device_id TEXT,
                    ip_address TEXT,
                    payment_method_id TEXT,
                    billing_address_id TEXT,
                    shipping_address_id TEXT,
                    email_domain TEXT,
                    is_promo_used INTEGER,
                    promo_code TEXT,
                    risk_score REAL,
                    decision TEXT,
                    evaluated_at TEXT,
                    PRIMARY KEY (merchant_id, transaction_id)
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_merchant_user_ts ON runtime_transactions(merchant_id, user_id, timestamp)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_merchant_ts ON runtime_transactions(merchant_id, timestamp)")

            # 2. User Profiles table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_profiles (
                    merchant_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    first_seen_timestamp TEXT NOT NULL,
                    email_domain TEXT,
                    PRIMARY KEY (merchant_id, user_id)
                )
            """)

            # 3. Idempotency table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS idempotency_records (
                    merchant_id TEXT NOT NULL,
                    idempotency_key TEXT NOT NULL,
                    transaction_id TEXT NOT NULL,
                    response_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    PRIMARY KEY (merchant_id, idempotency_key)
                )
            """)

            # 4. Outcomes table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS transaction_outcomes (
                    merchant_id TEXT NOT NULL,
                    transaction_id TEXT NOT NULL,
                    outcome TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    notes TEXT,
                    PRIMARY KEY (merchant_id, transaction_id)
                )
            """)

            # 5. Lifecycle events table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS merchant_events (
                    merchant_id TEXT NOT NULL,
                    event_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    transaction_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    metadata_json TEXT,
                    PRIMARY KEY (merchant_id, event_id)
                )
            """)
            conn.commit()

    def _hydrate_graphs_from_db(self):
        """Hydrates in-memory merchant entity graphs from stored transactions."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT merchant_id, user_id, device_id, ip_address, payment_method_id, shipping_address_id, billing_address_id, timestamp FROM runtime_transactions ORDER BY timestamp ASC")
            for row in cursor.fetchall():
                m_id = row["merchant_id"]
                u_id = row["user_id"]
                dt = datetime.strptime(row["timestamp"], "%Y-%m-%d %H:%M:%S")
                self._insert_graph_edges(m_id, u_id, row["device_id"], row["ip_address"], row["payment_method_id"], row["shipping_address_id"], row["billing_address_id"], dt)

    def _insert_graph_edges(self, merchant_id: str, user_id: str, dev: str, ip: str, pmt: str, ship: str, bill: str, dt: datetime):
        """Adds bipartite entity edges to the merchant's isolated graph."""
        g = self.merchant_graphs[merchant_id]
        user_node = ("USER", str(user_id))
        g.add_node(user_node, node_type="USER", id=str(user_id))

        entities = [
            ("DEVICE", str(dev)) if dev else None,
            ("IP", str(ip)) if ip else None,
            ("PAYMENT", str(pmt)) if pmt else None,
            ("SHIPPING_ADDR", str(ship)) if ship else None,
            ("BILLING_ADDR", str(bill)) if bill else None,
        ]

        for ent in entities:
            if ent and ent[1]:
                g.add_node(ent, node_type=ent[0], id=ent[1])
                # If edge already exists, preserve the earliest observed timestamp
                if g.has_edge(user_node, ent):
                    existing_ts = g[user_node][ent].get("timestamp", dt)
                    if dt < existing_ts:
                        g[user_node][ent]["timestamp"] = dt
                else:
                    g.add_edge(user_node, ent, timestamp=dt)

    def get_idempotency_result(self, merchant_id: str, idempotency_key: str) -> Optional[Dict[str, Any]]:
        """Retrieves cached response for an idempotency key under a specific merchant."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT response_json FROM idempotency_records WHERE merchant_id = ? AND idempotency_key = ?",
                (merchant_id, idempotency_key),
            )
            row = cursor.fetchone()
            if row:
                return json.loads(row["response_json"])
        return None

    def save_idempotency_result(self, merchant_id: str, idempotency_key: str, transaction_id: str, response_dict: Dict[str, Any]):
        """Persists evaluation response for an idempotency key under a specific merchant."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO idempotency_records (merchant_id, idempotency_key, transaction_id, response_json, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (merchant_id, idempotency_key, transaction_id, json.dumps(response_dict), datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")),
            )
            conn.commit()

    def get_user_profile(self, merchant_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves user profile (first seen timestamp and email domain) for merchant."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT first_seen_timestamp, email_domain FROM user_profiles WHERE merchant_id = ? AND user_id = ?",
                (merchant_id, user_id),
            )
            row = cursor.fetchone()
            if row:
                return {
                    "first_seen_timestamp": datetime.strptime(row["first_seen_timestamp"], "%Y-%m-%d %H:%M:%S"),
                    "email_domain": row["email_domain"],
                }
        return None

    def get_user_transactions_before(self, merchant_id: str, user_id: str, before_dt: datetime) -> List[Dict[str, Any]]:
        """
        Retrieves all historical transactions for a user strictly prior to timestamp before_dt.
        """
        before_str = before_dt.strftime("%Y-%m-%d %H:%M:%S")
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT transaction_id, user_id, amount, timestamp, is_promo_used, device_id, ip_address, payment_method_id, shipping_address_id, billing_address_id
                FROM runtime_transactions
                WHERE merchant_id = ? AND user_id = ? AND timestamp < ?
                ORDER BY timestamp ASC
                """,
                (merchant_id, user_id, before_str),
            )
            rows = cursor.fetchall()
            results = []
            for r in rows:
                results.append({
                    "transaction_id": r["transaction_id"],
                    "user_id": r["user_id"],
                    "amount": float(r["amount"]),
                    "timestamp": datetime.strptime(r["timestamp"], "%Y-%m-%d %H:%M:%S"),
                    "is_promo_used": int(r["is_promo_used"]),
                    "device_id": r["device_id"] or "",
                    "ip_address": r["ip_address"] or "",
                    "payment_method_id": r["payment_method_id"] or "",
                    "shipping_address_id": r["shipping_address_id"] or "",
                    "billing_address_id": r["billing_address_id"] or "",
                })
            return results

    def get_entity_prior_users(self, merchant_id: str, entity_type: str, entity_id: str, before_dt: datetime) -> Set[str]:
        """
        Returns the set of distinct user_ids that were linked to entity_id strictly before before_dt.
        """
        if not entity_id:
            return set()
        g = self.merchant_graphs.get(merchant_id)
        if g is None:
            return set()

        ent_node = (entity_type, str(entity_id))
        if not g.has_node(ent_node):
            return set()

        prior_users = set()
        for u_node in g.neighbors(ent_node):
            if u_node[0] == "USER":
                edge_ts = g[u_node][ent_node].get("timestamp")
                if edge_ts is not None and edge_ts < before_dt:
                    prior_users.add(u_node[1])
        return prior_users

    def get_connected_subgraph_stats(self, merchant_id: str, user_id: str, before_dt: datetime) -> Tuple[int, int, int, float]:
        """
        Computes connected component metrics in the merchant's graph containing only edges with timestamp < before_dt.
        Returns: (comp_user_count, total_nodes, total_edges, density)
        """
        g = self.merchant_graphs.get(merchant_id)
        user_node = ("USER", str(user_id))
        if g is None or not g.has_node(user_node):
            return 1, 1, 0, 0.0

        # Build point-in-time subgraph containing only edges established strictly before before_dt
        valid_edges = [
            (u, v) for u, v, data in g.edges(data=True)
            if data.get("timestamp") is not None and data["timestamp"] < before_dt
        ]
        sub_g = nx.Graph()
        sub_g.add_edges_from(valid_edges)

        if not sub_g.has_node(user_node):
            return 1, 1, 0, 0.0

        comp_nodes = nx.node_connected_component(sub_g, user_node)
        comp_user_count = sum(1 for n in comp_nodes if n[0] == "USER")
        total_nodes = len(comp_nodes)

        comp_sub = sub_g.subgraph(comp_nodes)
        edge_count = comp_sub.number_of_edges()
        density = nx.density(comp_sub) if total_nodes > 1 else 0.0

        return max(1, comp_user_count), max(1, total_nodes), edge_count, float(density)

    def record_evaluated_transaction(
        self,
        merchant_id: str,
        tx: CanonicalTransaction,
        risk_score: float,
        decision: str,
        evaluated_at: str,
    ):
        """
        Commits evaluated transaction and updates user profile and entity graph.
        """
        ts_str = tx.timestamp.strftime("%Y-%m-%d %H:%M:%S")

        with self._get_connection() as conn:
            cursor = conn.cursor()
            # 1. Insert transaction
            cursor.execute(
                """
                INSERT OR REPLACE INTO runtime_transactions (
                    merchant_id, transaction_id, user_id, amount, currency, timestamp,
                    product_category, device_id, ip_address, payment_method_id,
                    billing_address_id, shipping_address_id, email_domain,
                    is_promo_used, promo_code, risk_score, decision, evaluated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    merchant_id,
                    tx.transaction_id,
                    tx.user_id,
                    tx.amount,
                    tx.currency,
                    ts_str,
                    tx.product_category,
                    tx.device_id,
                    tx.ip_address,
                    tx.payment_method_id,
                    tx.billing_address_id,
                    tx.shipping_address_id,
                    tx.email_domain,
                    tx.is_promo_used,
                    tx.promo_code,
                    risk_score,
                    decision,
                    evaluated_at,
                ),
            )

            # 2. Update user profile if new
            cursor.execute(
                """
                INSERT OR IGNORE INTO user_profiles (merchant_id, user_id, first_seen_timestamp, email_domain)
                VALUES (?, ?, ?, ?)
                """,
                (merchant_id, tx.user_id, ts_str, tx.email_domain),
            )
            conn.commit()

        # 3. Update in-memory merchant graph
        self._insert_graph_edges(
            merchant_id,
            tx.user_id,
            tx.device_id,
            tx.ip_address,
            tx.payment_method_id,
            tx.shipping_address_id,
            tx.billing_address_id,
            tx.timestamp,
        )

    def record_outcome(self, merchant_id: str, outcome_payload: OutcomePayload):
        """Stores merchant chargeback or fraud outcome feedback."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO transaction_outcomes (merchant_id, transaction_id, outcome, timestamp, notes)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    merchant_id,
                    outcome_payload.transaction_id,
                    outcome_payload.outcome,
                    outcome_payload.timestamp,
                    outcome_payload.notes or "",
                ),
            )
            conn.commit()

    def record_merchant_event(self, merchant_id: str, event_payload: MerchantEventPayload):
        """Records asynchronous merchant lifecycle events."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO merchant_events (merchant_id, event_id, event_type, transaction_id, timestamp, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    merchant_id,
                    event_payload.event_id,
                    event_payload.event_type,
                    event_payload.transaction_id,
                    event_payload.timestamp,
                    json.dumps(event_payload.metadata or {}),
                ),
            )
            conn.commit()

    def get_transaction(self, merchant_id: str, transaction_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a previously evaluated transaction by transaction_id and merchant_id."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM runtime_transactions WHERE merchant_id = ? AND transaction_id = ?",
                (merchant_id, transaction_id),
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def get_last_processed_timestamp(self, merchant_id: str) -> Optional[str]:
        """Returns timestamp of the most recent transaction for a merchant."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT timestamp FROM runtime_transactions WHERE merchant_id = ? ORDER BY timestamp DESC LIMIT 1",
                (merchant_id,),
            )
            row = cursor.fetchone()
            if row:
                return row["timestamp"]
        return None
