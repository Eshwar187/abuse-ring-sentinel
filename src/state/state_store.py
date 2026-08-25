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
from datetime import datetime, timezone
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

            # 6. Merchants table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS merchants (
                    merchant_id TEXT PRIMARY KEY,
                    company_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)

            # 7. Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    merchant_id TEXT NOT NULL,
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    password_salt TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id)
                )
            """)

            # 8. API Keys table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS api_keys (
                    key_id TEXT PRIMARY KEY,
                    merchant_id TEXT NOT NULL,
                    key_hash TEXT NOT NULL UNIQUE,
                    key_prefix TEXT NOT NULL,
                    label TEXT,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    revoked_at TEXT,
                    FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id)
                )
            """)

            # 9. Auth Sessions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS auth_sessions (
                    session_token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    merchant_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(user_id),
                    FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id)
                )
            """)

            # 10. Merchant Integrations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS merchant_integrations (
                    merchant_id TEXT PRIMARY KEY,
                    action_endpoint_url TEXT,
                    auth_header_name TEXT NOT NULL DEFAULT 'Authorization',
                    auth_token TEXT,
                    webhook_secret TEXT,
                    timeout_seconds REAL NOT NULL DEFAULT 3.0,
                    max_retries INTEGER NOT NULL DEFAULT 2,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id)
                )
            """)

            # 11. Merchant Actions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS merchant_actions (
                    action_id TEXT PRIMARY KEY,
                    merchant_id TEXT NOT NULL,
                    transaction_id TEXT NOT NULL,
                    decision TEXT NOT NULL,
                    action TEXT NOT NULL,
                    attempt_number INTEGER NOT NULL DEFAULT 1,
                    status TEXT NOT NULL,
                    http_status INTEGER,
                    merchant_reference TEXT,
                    merchant_message TEXT,
                    latency_ms REAL,
                    payload_json TEXT,
                    response_json TEXT,
                    created_at TEXT NOT NULL,
                    completed_at TEXT,
                    FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id)
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_actions_tx ON merchant_actions(merchant_id, transaction_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_actions_status ON merchant_actions(merchant_id, status)")

            conn.commit()

        self._seed_default_merchants()

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
    def _seed_default_merchants(self):
        """Seeds default merchant accounts, dev users, and active API keys if not present."""
        from src.auth.security import hash_password, hash_api_key

        now_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        default_seed = [
            {
                "merchant_id": "merchant_dev_01",
                "company_name": "Apex Retail Global",
                "email": "dev@apexretail.com",
                "user_id": "usr_dev_01",
                "full_name": "Eshwar (Admin)",
                "password": "Password123!",
                "raw_api_key": "ars_live_test_merchant_01",
            },
            {
                "merchant_id": "merchant_dev_02",
                "company_name": "Nova Digital Goods",
                "email": "admin@novadigital.io",
                "user_id": "usr_dev_02",
                "full_name": "Sarah Connor",
                "password": "Password123!",
                "raw_api_key": "ars_live_demo_merchant_02",
            },
            {
                "merchant_id": "merchant_sandbox",
                "company_name": "Sandbox Merchant",
                "email": "sandbox@merchant.in",
                "user_id": "usr_dev_sandbox",
                "full_name": "Sandbox Tester",
                "password": "Password123!",
                "raw_api_key": "ars_live_sandbox_key",
            },
        ]

        with self._get_connection() as conn:
            cursor = conn.cursor()
            for m in default_seed:
                cursor.execute(
                    "INSERT OR IGNORE INTO merchants (merchant_id, company_name, email, created_at) VALUES (?, ?, ?, ?)",
                    (m["merchant_id"], m["company_name"], m["email"], now_str),
                )
                pwd_hash, pwd_salt = hash_password(m["password"])
                cursor.execute(
                    "INSERT OR IGNORE INTO users (user_id, merchant_id, full_name, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (m["user_id"], m["merchant_id"], m["full_name"], m["email"], pwd_hash, pwd_salt, now_str),
                )
                k_hash = hash_api_key(m["raw_api_key"])
                k_prefix = m["raw_api_key"][:12] + "..."
                cursor.execute(
                    "INSERT OR IGNORE INTO api_keys (key_id, merchant_id, key_hash, key_prefix, label, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)",
                    (f"key_{m['merchant_id']}_init", m["merchant_id"], k_hash, k_prefix, "Initial Dev Key", now_str),
                )
            conn.commit()

    # -------------------------------------------------------------------------
    # Authentication & User State Operations
    # -------------------------------------------------------------------------
    def create_merchant_user(
        self,
        company_name: str,
        full_name: str,
        email: str,
        password_hash: str,
        password_salt: str,
    ) -> Tuple[str, str, str, str]:
        """
        Creates a new merchant tenant, initial user, and first API key.
        Returns (merchant_id, user_id, raw_api_key, key_prefix).
        """
        import uuid
        from src.auth.security import generate_api_key

        now_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        merchant_id = f"m_{uuid.uuid4().hex[:10]}"
        user_id = f"usr_{uuid.uuid4().hex[:10]}"
        raw_key, key_hash, key_prefix = generate_api_key()
        key_id = f"key_{uuid.uuid4().hex[:8]}"

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO merchants (merchant_id, company_name, email, created_at) VALUES (?, ?, ?, ?)",
                (merchant_id, company_name, email, now_str),
            )
            cursor.execute(
                "INSERT INTO users (user_id, merchant_id, full_name, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (user_id, merchant_id, full_name, email, password_hash, password_salt, now_str),
            )
            cursor.execute(
                "INSERT INTO api_keys (key_id, merchant_id, key_hash, key_prefix, label, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)",
                (key_id, merchant_id, key_hash, key_prefix, "Primary Production Key", now_str),
            )
            conn.commit()

        return merchant_id, user_id, raw_key, key_prefix

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def get_merchant_by_id(self, merchant_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM merchants WHERE merchant_id = ?", (merchant_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def create_session(self, user_id: str, merchant_id: str) -> str:
        from src.auth.security import generate_session_token
        from datetime import timedelta

        token = generate_session_token()
        now = datetime.now()
        now_str = now.strftime("%Y-%m-%dT%H:%M:%SZ")
        expires_str = (now + timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO auth_sessions (session_token, user_id, merchant_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
                (token, user_id, merchant_id, now_str, expires_str),
            )
            conn.commit()
        return token

    def get_session(self, session_token: str) -> Optional[Dict[str, Any]]:
        if not session_token:
            return None
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT s.session_token, s.user_id, s.merchant_id, s.created_at, s.expires_at,
                       u.full_name, u.email, m.company_name
                FROM auth_sessions s
                JOIN users u ON s.user_id = u.user_id
                JOIN merchants m ON s.merchant_id = m.merchant_id
                WHERE s.session_token = ?
                """,
                (session_token.strip(),),
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def validate_api_key(self, raw_key: str) -> Optional[str]:
        """Validates raw API key and returns merchant_id if valid and active."""
        from src.auth.security import hash_api_key

        k_hash = hash_api_key(raw_key)
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT merchant_id FROM api_keys WHERE key_hash = ? AND is_active = 1",
                (k_hash,),
            )
            row = cursor.fetchone()
            if row:
                return row["merchant_id"]
        return None

    def get_active_api_key_prefix(self, merchant_id: str) -> str:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT key_prefix FROM api_keys WHERE merchant_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1",
                (merchant_id,),
            )
            row = cursor.fetchone()
            if row:
                return row["key_prefix"]
        return "ars_live_••••••••••••"

    def rotate_api_key(self, merchant_id: str) -> Tuple[str, str, str]:
        """Revokes old API keys and issues a new active API key. Returns (raw_key, key_prefix, created_at)."""
        import uuid
        from src.auth.security import generate_api_key

        now_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        raw_key, key_hash, key_prefix = generate_api_key()
        key_id = f"key_{uuid.uuid4().hex[:8]}"

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE api_keys SET is_active = 0, revoked_at = ? WHERE merchant_id = ?",
                (now_str, merchant_id),
            )
            cursor.execute(
                "INSERT INTO api_keys (key_id, merchant_id, key_hash, key_prefix, label, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)",
                (key_id, merchant_id, key_hash, key_prefix, "Rotated API Key", now_str),
            )
            conn.commit()

        return raw_key, key_prefix, now_str

    # -------------------------------------------------------------------------
    # Live Merchant Data & Query Operations
    # -------------------------------------------------------------------------
    def get_merchant_transactions(
        self,
        merchant_id: str,
        search: Optional[str] = None,
        risk_level: Optional[str] = None,
        decision: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Queries runtime transactions for a specific merchant with search and filters."""
        query = "SELECT * FROM runtime_transactions WHERE merchant_id = ?"
        count_query = "SELECT COUNT(*) as count FROM runtime_transactions WHERE merchant_id = ?"
        params: List[Any] = [merchant_id]
        count_params: List[Any] = [merchant_id]

        if search:
            s = f"%{search.strip()}%"
            filter_clause = " AND (transaction_id LIKE ? OR user_id LIKE ? OR promo_code LIKE ? OR email_domain LIKE ?)"
            query += filter_clause
            count_query += filter_clause
            params.extend([s, s, s, s])
            count_params.extend([s, s, s, s])

        if risk_level:
            query += " AND risk_level = ?"
            count_query += " AND risk_level = ?"
            params.append(risk_level.upper())
            count_params.append(risk_level.upper())

        if decision:
            query += " AND decision = ?"
            count_query += " AND decision = ?"
            params.append(decision.upper())
            count_params.append(decision.upper())

        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(count_query, count_params)
            total_count = cursor.fetchone()["count"]

            cursor.execute(query, params)
            rows = cursor.fetchall()
            transactions = [dict(r) for r in rows]

        return transactions, total_count

    def get_merchant_live_metrics(self, merchant_id: str) -> Dict[str, Any]:
        """Calculates live operational telemetry for the merchant from runtime transactions."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN decision = 'APPROVE' THEN 1 ELSE 0 END) as approvals,
                    SUM(CASE WHEN decision = 'REVIEW' THEN 1 ELSE 0 END) as reviews,
                    SUM(CASE WHEN decision = 'BLOCK' THEN 1 ELSE 0 END) as blocks,
                    AVG(risk_score) as avg_risk,
                    MAX(evaluated_at) as last_evaluated_at
                FROM runtime_transactions
                WHERE merchant_id = ?
                """,
                (merchant_id,),
            )
            agg = cursor.fetchone()

            total = agg["total"] or 0
            approvals = agg["approvals"] or 0
            reviews = agg["reviews"] or 0
            blocks = agg["blocks"] or 0
            avg_risk = round(float(agg["avg_risk"] or 0.0), 4)
            last_evaluated_at = agg["last_evaluated_at"]

            # Recent transactions
            cursor.execute(
                "SELECT * FROM runtime_transactions WHERE merchant_id = ? ORDER BY timestamp DESC LIMIT 10",
                (merchant_id,),
            )
            recent_rows = [dict(r) for r in cursor.fetchall()]

        return {
            "merchant_id": merchant_id,
            "total_transactions": total,
            "approvals": approvals,
            "reviews": reviews,
            "blocks": blocks,
            "approval_rate": round(approvals / total, 4) if total > 0 else 0.0,
            "review_rate": round(reviews / total, 4) if total > 0 else 0.0,
            "block_rate": round(blocks / total, 4) if total > 0 else 0.0,
            "average_risk_score": avg_risk,
            "recent_transactions": recent_rows,
            "zero_data_state": total == 0,
            "last_evaluated_at": last_evaluated_at,
        }

    def get_merchant_entity_graph(self, merchant_id: str) -> Dict[str, Any]:
        """Returns Cytoscape-formatted nodes and edges for the merchant's live entity graph."""
        g = self.merchant_graphs.get(merchant_id)
        if not g or g.number_of_nodes() == 0:
            return {
                "merchant_id": merchant_id,
                "nodes": [],
                "edges": [],
                "total_nodes": 0,
                "total_edges": 0,
                "zero_data_state": True,
            }

        nodes = []
        for n, d in g.nodes(data=True):
            node_type = d.get("entity_type", "USER")
            label = n.split(":")[-1] if ":" in n else n
            nodes.append({
                "data": {
                    "id": n,
                    "label": label,
                    "type": node_type,
                }
            })

        edges = []
        for u, v, d in g.edges(data=True):
            edge_id = f"e_{u}_{v}"
            edge_type = d.get("entity_type", "SHARED_ENTITY")
            edges.append({
                "data": {
                    "id": edge_id,
                    "source": u,
                    "target": v,
                    "type": edge_type,
                }
            })

        return {
            "merchant_id": merchant_id,
            "nodes": nodes,
            "edges": edges,
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "zero_data_state": len(nodes) == 0,
        }

    # -------------------------------------------------------------------------
    # Merchant Outbound Action & Integration Configuration Subsystem
    # -------------------------------------------------------------------------
    def save_merchant_integration(
        self,
        merchant_id: str,
        action_endpoint_url: Optional[str] = None,
        auth_header_name: str = "Authorization",
        auth_token: Optional[str] = None,
        webhook_secret: Optional[str] = None,
        timeout_seconds: float = 3.0,
        max_retries: int = 2,
        is_active: bool = True,
    ) -> None:
        """Saves or updates merchant outbound webhook and action execution config."""
        now_str = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Fetch existing to preserve tokens if not passed
            cursor.execute("SELECT * FROM merchant_integrations WHERE merchant_id = ?", (merchant_id,))
            existing = cursor.fetchone()

            final_auth_token = auth_token if auth_token is not None else (existing["auth_token"] if existing else None)
            final_secret = webhook_secret if webhook_secret is not None else (existing["webhook_secret"] if existing else None)
            final_url = action_endpoint_url if action_endpoint_url is not None else (existing["action_endpoint_url"] if existing else None)

            cursor.execute(
                """
                INSERT INTO merchant_integrations (
                    merchant_id, action_endpoint_url, auth_header_name, auth_token,
                    webhook_secret, timeout_seconds, max_retries, is_active, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(merchant_id) DO UPDATE SET
                    action_endpoint_url = excluded.action_endpoint_url,
                    auth_header_name = excluded.auth_header_name,
                    auth_token = excluded.auth_token,
                    webhook_secret = excluded.webhook_secret,
                    timeout_seconds = excluded.timeout_seconds,
                    max_retries = excluded.max_retries,
                    is_active = excluded.is_active,
                    updated_at = excluded.updated_at
                """,
                (
                    merchant_id,
                    final_url,
                    auth_header_name,
                    final_auth_token,
                    final_secret,
                    timeout_seconds,
                    max_retries,
                    1 if is_active else 0,
                    now_str,
                ),
            )
            conn.commit()

    def get_merchant_integration(self, merchant_id: str, include_secrets: bool = False) -> Optional[Dict[str, Any]]:
        """Retrieves merchant integration config with masked secrets for safe serialization."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM merchant_integrations WHERE merchant_id = ?", (merchant_id,))
            row = cursor.fetchone()
            if not row:
                return {
                    "merchant_id": merchant_id,
                    "action_endpoint_url": None,
                    "auth_header_name": "Authorization",
                    "auth_token": None,
                    "auth_token_masked": None,
                    "webhook_secret": None,
                    "webhook_secret_masked": None,
                    "timeout_seconds": 3.0,
                    "max_retries": 2,
                    "is_active": False,
                    "updated_at": None,
                }

            d = dict(row)
            d["is_active"] = bool(d["is_active"])
            raw_token = d.get("auth_token")
            raw_secret = d.get("webhook_secret")
            d["auth_token_masked"] = f"••••••••{raw_token[-4:]}" if raw_token and len(raw_token) > 4 else ("••••" if raw_token else None)
            d["webhook_secret_masked"] = f"••••••••{raw_secret[-4:]}" if raw_secret and len(raw_secret) > 4 else ("••••" if raw_secret else None)
            if not include_secrets:
                d["auth_token"] = None
                d["webhook_secret"] = None
            return d

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
        created_at: Optional[str] = None,
        completed_at: Optional[str] = None,
    ) -> None:
        """Inserts or updates an action execution attempt."""
        now_str = created_at or datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO merchant_actions (
                    action_id, merchant_id, transaction_id, decision, action,
                    attempt_number, status, http_status, merchant_reference, merchant_message,
                    latency_ms, payload_json, response_json, created_at, completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(action_id) DO UPDATE SET
                    attempt_number = excluded.attempt_number,
                    status = excluded.status,
                    http_status = excluded.http_status,
                    merchant_reference = excluded.merchant_reference,
                    merchant_message = excluded.merchant_message,
                    latency_ms = excluded.latency_ms,
                    payload_json = excluded.payload_json,
                    response_json = excluded.response_json,
                    completed_at = excluded.completed_at
                """,
                (
                    action_id,
                    merchant_id,
                    transaction_id,
                    decision,
                    action,
                    attempt_number,
                    status,
                    http_status,
                    merchant_reference,
                    merchant_message,
                    latency_ms,
                    payload_json,
                    response_json,
                    now_str,
                    completed_at,
                ),
            )
            conn.commit()

    def get_action_by_id(self, action_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves action record by its deterministic action_id."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM merchant_actions WHERE action_id = ?", (action_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_action_by_tx(self, merchant_id: str, transaction_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves latest action record for a transaction."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM merchant_actions WHERE merchant_id = ? AND transaction_id = ? ORDER BY created_at DESC LIMIT 1",
                (merchant_id, transaction_id),
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_merchant_actions(
        self,
        merchant_id: str,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Queries historical merchant actions with optional status filter."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM merchant_actions WHERE merchant_id = ?"
            params: List[Any] = [merchant_id]

            if status:
                query += " AND status = ?"
                params.append(status.upper())

            # Count total
            count_query = query.replace("SELECT *", "SELECT COUNT(*)")
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]

            # Fetch page
            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [dict(r) for r in rows], total_count

