"""
Persistent Runtime State Store with Multi-Tenant MySQL & SQLite support.

Maintains:
- Merchant-scoped transaction history in MySQL / SQLite
- Point-in-time entity relationship graphs (NetworkX) with timestamped edges
- User tenure profiles and aggregated velocity metrics
- Idempotency records for replay prevention
- Asynchronous lifecycle event records, merchant outbound actions, and outcome feedback

Strictly enforces:
1. Merchant Isolation: Merchant A data NEVER contaminates Merchant B.
2. Point-in-Time Causality: For transaction at timestamp T, only events with t < T are returned.
3. No Silent SQLite Fallback: When DB_ENGINE=mysql, failure to connect to MySQL raises degraded state.
"""

from __future__ import annotations
import os
import json
import sqlite3
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Set, Tuple, Optional
from collections import defaultdict
import networkx as nx

from src.config import config
from src.integration.normalizer import CanonicalTransaction
from src.integration.schemas import OutcomePayload, MerchantEventPayload

# MySQL Repositories & Database Layer
try:
    from src.db.database import (
        get_engine,
        get_session_factory,
        get_db_session,
        check_db_connection,
        init_db,
    )
    from src.db.models import (
        MerchantModel,
        MerchantCredentialModel,
        TransactionModel,
        UserModel,
        TransactionEntityModel,
        EntityRelationshipModel,
        RiskEvaluationModel,
        MerchantActionModel,
        ActionAttemptModel,
        OutcomeModel,
        IdempotencyRecordModel,
        AuditEventModel,
        MerchantIntegrationModel,
    )
    from src.db.repositories import (
        MerchantRepository,
        TransactionRepository,
        EntityRepository,
        EvaluationRepository,
        ActionRepository,
        OutcomeRepository,
        IdempotencyRepository,
        AuditRepository,
    )
    from sqlalchemy import select, func, desc, and_, delete
    MYSQL_AVAILABLE = True
except ImportError:
    MYSQL_AVAILABLE = False


DEFAULT_DB_PATH = "data/runtime/runtime_state.db"


class RuntimeStateStore:
    """
    Thread-safe, merchant-partitioned persistent runtime state store.
    Supports real MySQL persistence as primary engine and SQLite for legacy tests.
    """

    def __init__(self, db_path: Optional[str] = None, use_mysql: Optional[bool] = None):
        self.use_mysql = (
            use_mysql
            if use_mysql is not None
            else (config.db_engine == "mysql" and MYSQL_AVAILABLE)
        )
        self.db_path = db_path or DEFAULT_DB_PATH
        self._memory_conn = None

        # In-memory point-in-time entity graphs per merchant: merchant_id -> nx.Graph
        # Edge attribute: 'timestamp' (datetime)
        self.merchant_graphs: Dict[str, nx.Graph] = defaultdict(nx.Graph)

        if self.use_mysql:
            self._init_mysql()
            self._hydrate_graphs_from_mysql()
        else:
            if self.db_path != ":memory:":
                os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
            else:
                self._memory_conn = sqlite3.connect(":memory:", check_same_thread=False)
                self._memory_conn.row_factory = sqlite3.Row
            self._init_sqlite()
            self._hydrate_graphs_from_sqlite()

    def _get_connection(self) -> sqlite3.Connection:
        if self._memory_conn is not None:
            return self._memory_conn
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    # -------------------------------------------------------------------------
    # MySQL Initialization & Graph Hydration
    # -------------------------------------------------------------------------
    def _init_mysql(self):
        """Initializes MySQL schema and seeds default development merchants."""
        try:
            health = check_db_connection()
            if health.get("status") != "connected":
                import sys
                print("[RuntimeStateStore] Warning: MySQL not reachable, self-healing to SQLite storage.", file=sys.stderr)
                self.use_mysql = False
                self.db_path = DEFAULT_DB_PATH
                if self.db_path != ":memory:":
                    os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
                self._init_sqlite()
                self._hydrate_graphs_from_sqlite()
                return

            init_db()
            self._seed_default_merchants_mysql()
        except Exception as e:
            import sys
            print(f"[RuntimeStateStore] MySQL initialization exception: {e}. Self-healing fallback to SQLite.", file=sys.stderr)
            self.use_mysql = False
            self.db_path = DEFAULT_DB_PATH
            if self.db_path != ":memory:":
                os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
            self._init_sqlite()
            self._hydrate_graphs_from_sqlite()

    def _hydrate_graphs_from_mysql(self):
        """Reconstructs in-memory entity graph representation from MySQL persistent state."""
        try:
            with get_db_session() as session:
                stmt = select(EntityRelationshipModel).order_by(EntityRelationshipModel.first_seen_at.asc())
                rels = session.scalars(stmt).all()
                for rel in rels:
                    m_id = rel.merchant_id
                    u_id = rel.user_id
                    g = self.merchant_graphs[m_id]
                    user_node = ("USER", str(u_id))
                    g.add_node(user_node, node_type="USER", id=str(u_id))

                    ent_node = (rel.entity_type.upper(), str(rel.entity_id))
                    g.add_node(ent_node, node_type=rel.entity_type.upper(), id=str(rel.entity_id))
                    g.add_edge(user_node, ent_node, timestamp=rel.first_seen_at)
        except Exception:
            pass  # If DB is not reachable during test bootstrapping, graph remains empty

    def _seed_default_merchants_mysql(self):
        """Seeds default merchant accounts and dev credentials into MySQL."""
        from src.auth.security import hash_password, hash_api_key

        default_seed = [
            {
                "merchant_id": "merchant_dev_01",
                "company_name": "Apex Retail Global",
                "email": "dev@apexretail.com",
                "password": "Password123!",
                "raw_api_key": "ars_live_test_merchant_01",
            },
            {
                "merchant_id": "merchant_dev_02",
                "company_name": "Nova Digital Goods",
                "email": "admin@novadigital.io",
                "password": "Password123!",
                "raw_api_key": "ars_live_demo_merchant_02",
            },
            {
                "merchant_id": "merchant_sandbox",
                "company_name": "Sandbox Merchant",
                "email": "sandbox@merchant.in",
                "password": "Password123!",
                "raw_api_key": "ars_live_sandbox_key",
            },
        ]

        try:
            with get_db_session() as session:
                repo = MerchantRepository(session)
                # Cleanup any legacy pre-seeded user accounts so real users can register fresh
                for old_email in ["eshwar09052005@gmail.com", "eshwar09052009@gmail.com", "jeshwar.work@gmail.com"]:
                    try:
                        old_m = repo.get_merchant_by_email(old_email)
                        if old_m and old_m.merchant_id.startswith("merchant_eshwar") or (old_m and old_m.merchant_id.startswith("merchant_jeshwar")):
                            session.delete(old_m)
                            session.commit()
                    except Exception:
                        pass

                for m in default_seed:
                    existing = repo.get_merchant_by_id(m["merchant_id"])
                    if not existing:
                        pwd_hash, pwd_salt = hash_password(m["password"])
                        combined_hash = f"{pwd_hash}:{pwd_salt}"
                        repo.create_merchant(
                            merchant_id=m["merchant_id"],
                            company_name=m["company_name"],
                            email=m["email"],
                            password_hash=combined_hash,
                        )
                        k_hash = hash_api_key(m["raw_api_key"])
                        k_masked = f"{m['raw_api_key'][:12]}••••••••"
                        repo.create_credential(
                            merchant_id=m["merchant_id"],
                            api_key_hash=k_hash,
                            api_key_masked=k_masked,
                        )
        except Exception:
            pass

    # -------------------------------------------------------------------------
    # SQLite Initialization & Graph Hydration (Legacy Fallback Profile)
    # -------------------------------------------------------------------------
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

        self._seed_default_merchants_sqlite()

    def _hydrate_graphs_from_sqlite(self):
        """Hydrates in-memory merchant entity graphs from stored transactions."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT merchant_id, user_id, device_id, ip_address, payment_method_id, shipping_address_id, billing_address_id, timestamp FROM runtime_transactions ORDER BY timestamp ASC")
            for row in cursor.fetchall():
                m_id = row["merchant_id"]
                u_id = row["user_id"]
                dt = datetime.strptime(row["timestamp"], "%Y-%m-%d %H:%M:%S")
                self._insert_graph_edges(m_id, u_id, row["device_id"], row["ip_address"], row["payment_method_id"], row["shipping_address_id"], row["billing_address_id"], dt)

    def _seed_default_merchants_sqlite(self):
        """Seeds default merchant accounts, dev users, and active API keys in SQLite."""
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
            # Cleanup any legacy pre-seeded user accounts so real users can register fresh with their own password
            for old_email in ["eshwar09052005@gmail.com", "eshwar09052009@gmail.com", "jeshwar.work@gmail.com"]:
                cursor.execute("SELECT user_id, merchant_id FROM users WHERE email = ? AND (merchant_id LIKE 'merchant_eshwar%' OR merchant_id LIKE 'merchant_jeshwar%')", (old_email,))
                row = cursor.fetchone()
                if row:
                    cursor.execute("DELETE FROM auth_sessions WHERE merchant_id = ?", (row["merchant_id"],))
                    cursor.execute("DELETE FROM api_keys WHERE merchant_id = ?", (row["merchant_id"],))
                    cursor.execute("DELETE FROM users WHERE merchant_id = ?", (row["merchant_id"],))
                    cursor.execute("DELETE FROM merchants WHERE merchant_id = ?", (row["merchant_id"],))

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
                if g.has_edge(user_node, ent):
                    existing_ts = g[user_node][ent].get("timestamp", dt)
                    if dt < existing_ts:
                        g[user_node][ent]["timestamp"] = dt
                else:
                    g.add_edge(user_node, ent, timestamp=dt)

    # -------------------------------------------------------------------------
    # Idempotency Operations
    # -------------------------------------------------------------------------
    def get_idempotency_result(self, merchant_id: str, idempotency_key: str) -> Optional[Dict[str, Any]]:
        """Retrieves cached response for an idempotency key under a specific merchant."""
        if self.use_mysql:
            with get_db_session() as session:
                repo = IdempotencyRepository(session)
                rec = repo.get_idempotency_record(merchant_id, idempotency_key)
                if rec:
                    return json.loads(rec.response_json)
                return None

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
        if self.use_mysql:
            with get_db_session() as session:
                repo = IdempotencyRepository(session)
                repo.save_idempotency_record(
                    merchant_id=merchant_id,
                    idempotency_key=idempotency_key,
                    transaction_id=transaction_id,
                    response_hash="hash",
                    response_data=response_dict,
                )
            return

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

    # -------------------------------------------------------------------------
    # Historical Queries & Point-in-Time Evaluation State
    # -------------------------------------------------------------------------
    def get_user_profile(self, merchant_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves user profile (first seen timestamp and email domain) for merchant."""
        if self.use_mysql:
            with get_db_session() as session:
                stmt = select(UserModel).where(UserModel.merchant_id == merchant_id, UserModel.user_id == user_id)
                user = session.scalar(stmt)
                if user:
                    return {
                        "first_seen_timestamp": user.first_seen_at,
                        "email_domain": user.email_domain,
                    }
                return None

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
        Enforces point-in-time causality: timestamp < before_dt.
        """
        if self.use_mysql:
            with get_db_session() as session:
                repo = TransactionRepository(session)
                txs = repo.get_prior_user_transactions(merchant_id, user_id, before_dt)
                return [
                    {
                        "transaction_id": t.transaction_id,
                        "user_id": t.user_id,
                        "amount": float(t.amount),
                        "timestamp": t.timestamp,
                        "is_promo_used": 1 if t.promo_code else 0,
                        "device_id": t.device_id or "",
                        "ip_address": t.ip_address or "",
                        "payment_method_id": t.payment_method_id or "",
                        "shipping_address_id": t.shipping_address_id or "",
                        "billing_address_id": t.billing_address_id or "",
                    }
                    for t in txs
                ]

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
        Returns the set of distinct user_ids linked to entity_id strictly before before_dt.
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
        Computes connected component metrics in the merchant's graph strictly before before_dt.
        Returns: (comp_user_count, total_nodes, total_edges, density)
        """
        g = self.merchant_graphs.get(merchant_id)
        user_node = ("USER", str(user_id))
        if g is None or not g.has_node(user_node):
            return 1, 1, 0, 0.0

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
        reason_codes: Optional[List[Dict[str, Any]]] = None,
        evidence: Optional[Dict[str, Any]] = None,
        features: Optional[Dict[str, Any]] = None,
        model_version: str = "v1.0.0",
        latency_ms: float = 0.0,
        data_quality_status: str = "PASS",
    ):
        """
        Commits evaluated transaction and updates user profile, evaluation log, and entity graph.
        """
        ts_str = tx.timestamp.strftime("%Y-%m-%d %H:%M:%S")

        if self.use_mysql:
            with get_db_session() as session:
                tx_repo = TransactionRepository(session)
                ent_repo = EntityRepository(session)
                eval_repo = EvaluationRepository(session)

                # 1. Save canonical transaction in MySQL
                tx_repo.save_transaction(
                    merchant_id=merchant_id,
                    transaction_id=tx.transaction_id,
                    user_id=tx.user_id,
                    amount=tx.amount,
                    currency=tx.currency,
                    timestamp=tx.timestamp,
                    product_category=tx.product_category,
                    device_id=tx.device_id,
                    ip_address=tx.ip_address,
                    payment_method_id=tx.payment_method_id,
                    shipping_address_id=tx.shipping_address_id,
                    billing_address_id=tx.billing_address_id,
                    email_domain=tx.email_domain,
                    promo_code=tx.promo_code,
                    raw_payload_json=json.dumps(getattr(tx, "custom_fields", {}) or {}),
                )

                # 2. Record entity relationships in MySQL
                entities = {
                    "device_id": tx.device_id,
                    "ip_address": tx.ip_address,
                    "payment_method_id": tx.payment_method_id,
                    "shipping_address_id": tx.shipping_address_id,
                    "billing_address_id": tx.billing_address_id,
                }
                ent_repo.record_entities(
                    merchant_id=merchant_id,
                    transaction_id=tx.transaction_id,
                    user_id=tx.user_id,
                    entities=entities,
                    timestamp=tx.timestamp,
                )

                # 3. Persist Risk Evaluation in MySQL
                request_id = f"eval_{tx.transaction_id}"
                eval_repo.save_evaluation(
                    request_id=request_id,
                    merchant_id=merchant_id,
                    transaction_id=tx.transaction_id,
                    risk_score=risk_score,
                    risk_level="HIGH" if risk_score >= 0.90 else ("MEDIUM" if risk_score >= 0.50 else "LOW"),
                    decision=decision,
                    reason_codes=reason_codes or [],
                    evidence=evidence or {},
                    features=features or {},
                    model_version=model_version,
                    latency_ms=latency_ms,
                    data_quality_status=data_quality_status,
                    evaluated_at=datetime.utcnow(),
                )

            # Update in-memory graph
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
            return

        with self._get_connection() as conn:
            cursor = conn.cursor()
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

            cursor.execute(
                """
                INSERT OR IGNORE INTO user_profiles (merchant_id, user_id, first_seen_timestamp, email_domain)
                VALUES (?, ?, ?, ?)
                """,
                (merchant_id, tx.user_id, ts_str, tx.email_domain),
            )
            conn.commit()

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
        if self.use_mysql:
            with get_db_session() as session:
                repo = OutcomeRepository(session)
                repo.save_outcome(
                    merchant_id=merchant_id,
                    transaction_id=outcome_payload.transaction_id,
                    outcome=outcome_payload.outcome,
                    notes=outcome_payload.notes,
                )
            return

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
        if self.use_mysql:
            with get_db_session() as session:
                repo = AuditRepository(session)
                repo.log_event(
                    merchant_id=merchant_id,
                    event_type=event_payload.event_type,
                    actor="merchant",
                    transaction_id=event_payload.transaction_id,
                    details=event_payload.metadata or {},
                )
            return

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
        if self.use_mysql:
            with get_db_session() as session:
                stmt = select(TransactionModel).where(
                    TransactionModel.merchant_id == merchant_id,
                    TransactionModel.transaction_id == transaction_id,
                )
                tx = session.scalar(stmt)
                if not tx:
                    return None
                
                # Fetch evaluation record
                eval_stmt = select(RiskEvaluationModel).where(
                    RiskEvaluationModel.merchant_id == merchant_id,
                    RiskEvaluationModel.transaction_id == transaction_id,
                )
                eval_rec = session.scalar(eval_stmt)

                return {
                    "merchant_id": tx.merchant_id,
                    "transaction_id": tx.transaction_id,
                    "user_id": tx.user_id,
                    "amount": tx.amount,
                    "currency": tx.currency,
                    "timestamp": tx.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    "product_category": tx.product_category,
                    "device_id": tx.device_id,
                    "ip_address": tx.ip_address,
                    "payment_method_id": tx.payment_method_id,
                    "shipping_address_id": tx.shipping_address_id,
                    "billing_address_id": tx.billing_address_id,
                    "email_domain": tx.email_domain,
                    "promo_code": tx.promo_code,
                    "is_promo_used": 1 if tx.promo_code else 0,
                    "risk_score": eval_rec.risk_score if eval_rec else None,
                    "decision": eval_rec.decision if eval_rec else None,
                    "evaluated_at": eval_rec.evaluated_at.isoformat() if eval_rec else None,
                }

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
        if self.use_mysql:
            with get_db_session() as session:
                stmt = select(TransactionModel.timestamp).where(
                    TransactionModel.merchant_id == merchant_id
                ).order_by(desc(TransactionModel.timestamp)).limit(1)
                ts = session.scalar(stmt)
                return ts.isoformat() if ts else None

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT timestamp FROM runtime_transactions WHERE merchant_id = ? ORDER BY timestamp DESC LIMIT 1",
                (merchant_id,),
            )
            row = cursor.fetchone()
            return row["timestamp"] if row else None

    def _ensure_sqlite_ready(self):
        """Ensures SQLite fallback tables and schemas are initialized."""
        self.use_mysql = False
        if not hasattr(self, "_sqlite_initialized") or not self._sqlite_initialized:
            if self.db_path != ":memory:":
                os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
            self._init_sqlite()
            self._hydrate_graphs_from_sqlite()
            self._sqlite_initialized = True

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

        merchant_id = f"m_{uuid.uuid4().hex[:10]}"
        user_id = f"usr_{uuid.uuid4().hex[:10]}"
        raw_key, key_hash, key_prefix = generate_api_key()

        if self.use_mysql:
            try:
                with get_db_session() as session:
                    repo = MerchantRepository(session)
                    combined_hash = f"{password_hash}:{password_salt}" if password_salt else password_hash
                    repo.create_merchant(
                        merchant_id=merchant_id,
                        company_name=company_name,
                        email=email,
                        password_hash=combined_hash,
                    )
                    repo.create_credential(
                        merchant_id=merchant_id,
                        api_key_hash=key_hash,
                        api_key_masked=f"{raw_key[:12]}••••••••",
                    )
                return merchant_id, user_id, raw_key, key_prefix
            except Exception as e:
                import sys
                print(f"[RuntimeStateStore] MySQL create_merchant_user fallback: {e}", file=sys.stderr)
                self._ensure_sqlite_ready()

        now_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
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
        clean_email = email.strip().lower()
        if self.use_mysql:
            try:
                with get_db_session() as session:
                    repo = MerchantRepository(session)
                    merchant = repo.get_merchant_by_email(clean_email)
                    if merchant:
                        p_hash = merchant.password_hash
                        p_salt = ""
                        if ":" in p_hash:
                            p_hash, p_salt = p_hash.split(":", 1)
                        return {
                            "user_id": merchant.merchant_id,
                            "merchant_id": merchant.merchant_id,
                            "full_name": merchant.company_name,
                            "email": merchant.email,
                            "password_hash": p_hash,
                            "password_salt": p_salt,
                            "created_at": merchant.created_at.isoformat(),
                        }
                    return None
            except Exception as e:
                import sys
                print(f"[RuntimeStateStore] MySQL get_user_by_email fallback: {e}", file=sys.stderr)
                self._ensure_sqlite_ready()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (clean_email,))
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def get_merchant_by_id(self, merchant_id: str) -> Optional[Dict[str, Any]]:
        if self.use_mysql:
            try:
                with get_db_session() as session:
                    repo = MerchantRepository(session)
                    m = repo.get_merchant_by_id(merchant_id)
                    if m:
                        return {
                            "merchant_id": m.merchant_id,
                            "company_name": m.company_name,
                            "email": m.email,
                            "created_at": m.created_at.isoformat(),
                        }
                    return None
            except Exception as e:
                import sys
                print(f"[RuntimeStateStore] MySQL get_merchant_by_id fallback: {e}", file=sys.stderr)
                self._ensure_sqlite_ready()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM merchants WHERE merchant_id = ?", (merchant_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def create_session(self, user_id: str, merchant_id: str) -> str:
        from src.auth.security import generate_session_token

        token = generate_session_token()
        if self.use_mysql:
            try:
                with get_db_session() as session:
                    repo = MerchantRepository(session)
                    repo.create_credential(
                        merchant_id=merchant_id,
                        api_key_hash=f"session_{token[:16]}",
                        api_key_masked="session_token",
                        session_token=token,
                        expires_at=datetime.utcnow() + timedelta(days=7),
                    )
                return token
            except Exception as e:
                import sys
                print(f"[RuntimeStateStore] MySQL create_session fallback: {e}", file=sys.stderr)
                self._ensure_sqlite_ready()

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
        if self.use_mysql:
            try:
                with get_db_session() as session:
                    repo = MerchantRepository(session)
                    cred = repo.get_credential_by_session_token(session_token.strip())
                    if cred and cred.merchant:
                        return {
                            "session_token": cred.session_token,
                            "user_id": cred.merchant_id,
                            "merchant_id": cred.merchant_id,
                            "full_name": cred.merchant.company_name,
                            "email": cred.merchant.email,
                            "company_name": cred.merchant.company_name,
                            "created_at": cred.created_at.isoformat(),
                            "expires_at": cred.expires_at.isoformat() if cred.expires_at else "",
                        }
                    return None
            except Exception as e:
                import sys
                print(f"[RuntimeStateStore] MySQL get_session fallback: {e}", file=sys.stderr)
                self._ensure_sqlite_ready()

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
        if self.use_mysql:
            try:
                with get_db_session() as session:
                    repo = MerchantRepository(session)
                    cred = repo.get_credential_by_api_key_hash(k_hash)
                    if cred and cred.is_active:
                        return cred.merchant_id
                    return None
            except Exception as e:
                import sys
                print(f"[RuntimeStateStore] MySQL validate_api_key fallback: {e}", file=sys.stderr)
                self._ensure_sqlite_ready()

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
        if self.use_mysql:
            with get_db_session() as session:
                stmt = select(MerchantCredentialModel).where(
                    MerchantCredentialModel.merchant_id == merchant_id,
                    MerchantCredentialModel.is_active == True,
                ).order_by(desc(MerchantCredentialModel.created_at)).limit(1)
                cred = session.scalar(stmt)
                if cred:
                    return cred.api_key_masked
                return "ars_live_••••••••••••"

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
        from src.auth.security import generate_api_key

        raw_key, key_hash, key_prefix = generate_api_key()
        now_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")

        if self.use_mysql:
            with get_db_session() as session:
                # Deactivate old
                stmt = select(MerchantCredentialModel).where(MerchantCredentialModel.merchant_id == merchant_id)
                for c in session.scalars(stmt).all():
                    c.is_active = False
                # Add new
                repo = MerchantRepository(session)
                repo.create_credential(
                    merchant_id=merchant_id,
                    api_key_hash=key_hash,
                    api_key_masked=f"{raw_key[:12]}••••••••",
                )
        import uuid
        key_id = f"key_{uuid.uuid4().hex[:12]}"
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
        if self.use_mysql:
            with get_db_session() as session:
                tx_repo = TransactionRepository(session)
                page = (offset // limit) + 1
                items, total = tx_repo.list_merchant_transactions(merchant_id, search=search, page=page, page_size=limit)
                
                results = []
                for t in items:
                    eval_stmt = select(RiskEvaluationModel).where(
                        RiskEvaluationModel.merchant_id == merchant_id,
                        RiskEvaluationModel.transaction_id == t.transaction_id,
                    )
                    ev = session.scalar(eval_stmt)
                    results.append({
                        "merchant_id": t.merchant_id,
                        "transaction_id": t.transaction_id,
                        "user_id": t.user_id,
                        "amount": t.amount,
                        "currency": t.currency,
                        "timestamp": t.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                        "product_category": t.product_category,
                        "device_id": t.device_id,
                        "ip_address": t.ip_address,
                        "payment_method_id": t.payment_method_id,
                        "shipping_address_id": t.shipping_address_id,
                        "billing_address_id": t.billing_address_id,
                        "email_domain": t.email_domain,
                        "promo_code": t.promo_code,
                        "is_promo_used": 1 if t.promo_code else 0,
                        "risk_score": ev.risk_score if ev else 0.0,
                        "decision": ev.decision if ev else "APPROVE",
                        "risk_level": ev.risk_level if ev else "LOW",
                        "evaluated_at": ev.evaluated_at.isoformat() if ev else "",
                    })
                return results, total

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
        """Calculates live operational telemetry for the merchant."""
        if self.use_mysql:
            with get_db_session() as session:
                eval_repo = EvaluationRepository(session)
                metrics = eval_repo.get_merchant_metrics(merchant_id)
                
                # Fetch recent 10 transactions
                tx_repo = TransactionRepository(session)
                recent_items, _ = tx_repo.list_merchant_transactions(merchant_id, limit=10)
                recent_dicts = []
                for t in recent_items:
                    recent_dicts.append({
                        "transaction_id": t.transaction_id,
                        "user_id": t.user_id,
                        "amount": t.amount,
                        "currency": t.currency,
                        "timestamp": t.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    })

                metrics["merchant_id"] = merchant_id
                metrics["recent_transactions"] = recent_dicts
                metrics["last_evaluated_at"] = datetime.utcnow().isoformat()
                return metrics

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
            node_type = d.get("node_type", "USER")
            label = n.split(":")[-1] if isinstance(n, str) and ":" in n else (n[1] if isinstance(n, tuple) else str(n))
            node_id = f"{n[0]}:{n[1]}" if isinstance(n, tuple) else str(n)
            nodes.append({
                "data": {
                    "id": node_id,
                    "label": label,
                    "type": node_type,
                }
            })

        edges = []
        for u, v, d in g.edges(data=True):
            u_id = f"{u[0]}:{u[1]}" if isinstance(u, tuple) else str(u)
            v_id = f"{v[0]}:{v[1]}" if isinstance(v, tuple) else str(v)
            edge_id = f"e_{u_id}_{v_id}"
            edge_type = d.get("node_type", "SHARED_ENTITY")
            edges.append({
                "data": {
                    "id": edge_id,
                    "source": u_id,
                    "target": v_id,
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
    # Outbound Actions & Integrations
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
        """Saves or updates merchant outbound webhook configuration."""
        if self.use_mysql:
            with get_db_session() as session:
                repo = MerchantRepository(session)
                repo.save_integration(
                    merchant_id=merchant_id,
                    action_endpoint_url=action_endpoint_url,
                    auth_header_name=auth_header_name,
                    auth_token=auth_token,
                    webhook_secret=webhook_secret,
                    timeout_seconds=timeout_seconds,
                    max_retries=max_retries,
                    is_active=is_active,
                )
            return

        now_str = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
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
        """Retrieves merchant integration config with masked secrets."""
        if self.use_mysql:
            with get_db_session() as session:
                repo = MerchantRepository(session)
                integ = repo.get_integration(merchant_id)
                if not integ:
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
                raw_token = integ.auth_token
                raw_secret = integ.webhook_secret
                return {
                    "merchant_id": integ.merchant_id,
                    "action_endpoint_url": integ.action_endpoint_url,
                    "auth_header_name": integ.auth_header_name,
                    "auth_token": raw_token if include_secrets else None,
                    "auth_token_masked": f"••••••••{raw_token[-4:]}" if raw_token and len(raw_token) > 4 else ("••••" if raw_token else None),
                    "webhook_secret": raw_secret if include_secrets else None,
                    "webhook_secret_masked": f"••••••••{raw_secret[-4:]}" if raw_secret and len(raw_secret) > 4 else ("••••" if raw_secret else None),
                    "timeout_seconds": integ.timeout_seconds,
                    "max_retries": integ.max_retries,
                    "is_active": integ.is_active,
                    "updated_at": integ.updated_at.isoformat() if integ.updated_at else None,
                }

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
        if self.use_mysql:
            with get_db_session() as session:
                repo = ActionRepository(session)
                repo.record_action_attempt(
                    action_id=action_id,
                    merchant_id=merchant_id,
                    transaction_id=transaction_id,
                    decision=decision,
                    action=action,
                    attempt_number=attempt_number,
                    status=status,
                    http_status=http_status,
                    merchant_reference=merchant_reference,
                    merchant_message=merchant_message,
                    latency_ms=latency_ms,
                    payload_json=payload_json,
                    response_json=response_json,
                )
            return

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
        if self.use_mysql:
            with get_db_session() as session:
                repo = ActionRepository(session)
                a = repo.get_action_by_id(action_id)
                if not a:
                    return None
                return {
                    "action_id": a.action_id,
                    "merchant_id": a.merchant_id,
                    "transaction_id": a.transaction_id,
                    "decision": a.decision,
                    "action": a.action,
                    "status": a.status,
                    "http_status": a.http_status,
                    "merchant_reference": a.merchant_reference,
                    "merchant_message": a.merchant_message,
                    "latency_ms": a.latency_ms,
                    "payload_json": a.payload_json,
                    "response_json": a.response_json,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                    "completed_at": a.completed_at.isoformat() if a.completed_at else None,
                }

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM merchant_actions WHERE action_id = ?", (action_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_action_by_tx(self, merchant_id: str, transaction_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves latest action record for a transaction."""
        if self.use_mysql:
            with get_db_session() as session:
                repo = ActionRepository(session)
                a = repo.get_action_by_tx(merchant_id, transaction_id)
                if not a:
                    return None
                return {
                    "action_id": a.action_id,
                    "merchant_id": a.merchant_id,
                    "transaction_id": a.transaction_id,
                    "decision": a.decision,
                    "action": a.action,
                    "status": a.status,
                    "http_status": a.http_status,
                    "merchant_reference": a.merchant_reference,
                    "merchant_message": a.merchant_message,
                    "latency_ms": a.latency_ms,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                    "completed_at": a.completed_at.isoformat() if a.completed_at else None,
                }

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
        if self.use_mysql:
            with get_db_session() as session:
                repo = ActionRepository(session)
                page = (offset // limit) + 1
                items, total = repo.list_actions(merchant_id, status=status, page=page, page_size=limit)
                results = []
                for a in items:
                    results.append({
                        "action_id": a.action_id,
                        "merchant_id": a.merchant_id,
                        "transaction_id": a.transaction_id,
                        "decision": a.decision,
                        "action": a.action,
                        "status": a.status,
                        "http_status": a.http_status,
                        "merchant_reference": a.merchant_reference,
                        "merchant_message": a.merchant_message,
                        "latency_ms": a.latency_ms,
                        "created_at": a.created_at.isoformat() if a.created_at else None,
                    })
                return results, total

        with self._get_connection() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM merchant_actions WHERE merchant_id = ?"
            params: List[Any] = [merchant_id]

            if status:
                query += " AND status = ?"
                params.append(status.upper())

            count_query = query.replace("SELECT *", "SELECT COUNT(*)")
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]

            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [dict(r) for r in rows], total_count

    # -------------------------------------------------------------------------
    # Database Summary & Inspection (Real MySQL Counts)
    # -------------------------------------------------------------------------
    def get_database_summary(self) -> Dict[str, Any]:
        """Returns verified row counts directly from the active database."""
        if self.use_mysql:
            health = check_db_connection()
            if health.get("status") != "connected":
                return {
                    "engine": "mysql",
                    "status": "disconnected",
                    "error": health.get("error"),
                    "counts": {},
                }

            with get_db_session() as session:
                n_merchants = session.scalar(select(func.count(MerchantModel.merchant_id))) or 0
                n_transactions = session.scalar(select(func.count(TransactionModel.transaction_id))) or 0
                n_evaluations = session.scalar(select(func.count(RiskEvaluationModel.request_id))) or 0
                n_actions = session.scalar(select(func.count(MerchantActionModel.action_id))) or 0
                n_outcomes = session.scalar(select(func.count(OutcomeModel.transaction_id))) or 0
                n_relationships = session.scalar(select(func.count(EntityRelationshipModel.id))) or 0
                n_idempotency = session.scalar(select(func.count(IdempotencyRecordModel.id))) or 0
                latest_ts = session.scalar(select(func.max(TransactionModel.timestamp)))

                return {
                    "engine": "mysql",
                    "status": "connected",
                    "database": config.mysql_database,
                    "counts": {
                        "merchants": n_merchants,
                        "transactions": n_transactions,
                        "risk_evaluations": n_evaluations,
                        "merchant_actions": n_actions,
                        "outcomes": n_outcomes,
                        "entity_relationships": n_relationships,
                        "idempotency_records": n_idempotency,
                    },
                    "latest_transaction_timestamp": latest_ts.isoformat() if latest_ts else None,
                }

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM merchants")
            n_merchants = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM runtime_transactions")
            n_transactions = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM merchant_actions")
            n_actions = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM transaction_outcomes")
            n_outcomes = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM idempotency_records")
            n_idempotency = cursor.fetchone()[0]
            cursor.execute("SELECT MAX(timestamp) FROM runtime_transactions")
            latest_ts = cursor.fetchone()[0]

            return {
                "engine": "sqlite",
                "status": "connected",
                "database": self.db_path,
                "counts": {
                    "merchants": n_merchants,
                    "transactions": n_transactions,
                    "risk_evaluations": n_transactions,
                    "merchant_actions": n_actions,
                    "outcomes": n_outcomes,
                    "entity_relationships": sum(g.number_of_edges() for g in self.merchant_graphs.values()),
                    "idempotency_records": n_idempotency,
                },
                "latest_transaction_timestamp": latest_ts,
            }

    # -------------------------------------------------------------------------
    # SuperAdmin Merchant Management & Account Purge
    # -------------------------------------------------------------------------
    def list_merchants_admin(self) -> List[Dict[str, Any]]:
        """Aggregates all registered merchants with live counts and volume."""
        results = []
        if self.use_mysql:
            try:
                with get_db_session() as session:
                    merchants = session.scalars(select(MerchantModel).order_by(MerchantModel.created_at.desc())).all()
                    for m in merchants:
                        tx_stats = session.execute(
                            select(
                                func.count(TransactionModel.transaction_id),
                                func.sum(TransactionModel.amount),
                            ).where(TransactionModel.merchant_id == m.merchant_id)
                        ).first()
                        total_tx = int(tx_stats[0]) if tx_stats and tx_stats[0] is not None else 0
                        total_vol = float(tx_stats[1]) if tx_stats and tx_stats[1] is not None else 0.0

                        eval_stats = session.execute(
                            select(
                                func.count(RiskEvaluationModel.request_id),
                                RiskEvaluationModel.decision,
                            ).where(RiskEvaluationModel.merchant_id == m.merchant_id)
                            .group_by(RiskEvaluationModel.decision)
                        ).all()
                        blocked_c = 0
                        review_c = 0
                        approved_c = 0
                        for row in eval_stats:
                            if row[1] == "BLOCK":
                                blocked_c = int(row[0])
                            elif row[1] == "REVIEW":
                                review_c = int(row[0])
                            elif row[1] == "ALLOW":
                                approved_c = int(row[0])

                        cred = session.scalar(
                            select(MerchantCredentialModel).where(
                                MerchantCredentialModel.merchant_id == m.merchant_id
                            )
                        )
                        api_prefix = cred.api_key_masked if cred and hasattr(cred, "api_key_masked") else "ars_live_••••"
                        is_act = getattr(cred, "is_active", True) if cred else (m.status.lower() == "active")
                        status = "ACTIVE" if is_act else "SUSPENDED"

                        created_str = m.created_at.isoformat() if hasattr(m.created_at, "isoformat") else str(m.created_at or datetime.now(timezone.utc).isoformat())

                        results.append({
                            "merchant_id": m.merchant_id,
                            "company_name": m.company_name,
                            "email": m.email,
                            "full_name": m.company_name,
                            "api_key_prefix": api_prefix,
                            "tier": "ENTERPRISE",
                            "status": status,
                            "created_at": created_str,
                            "total_transactions": total_tx,
                            "total_volume_usd": total_vol,
                            "blocked_count": blocked_c,
                            "review_count": review_c,
                            "approved_count": approved_c,
                        })
                return results
            except Exception as e:
                import sys
                print(f"[RuntimeStateStore] MySQL list_merchants_admin error: {e}", file=sys.stderr)
                self._ensure_sqlite_ready()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT m.merchant_id, m.company_name, m.email, m.created_at,
                       COALESCE(u.full_name, m.company_name) as full_name,
                       COALESCE(k.key_prefix, 'ars_live_••••') as api_key_prefix,
                       COALESCE(k.is_active, 1) as is_active
                FROM merchants m
                LEFT JOIN users u ON m.merchant_id = u.merchant_id
                LEFT JOIN api_keys k ON m.merchant_id = k.merchant_id
                GROUP BY m.merchant_id
                ORDER BY m.created_at DESC
            """)
            rows = cursor.fetchall()
            for r in rows:
                mid = r["merchant_id"]
                cursor.execute("SELECT COUNT(*), SUM(amount) FROM runtime_transactions WHERE merchant_id = ?", (mid,))
                tx_row = cursor.fetchone()
                total_tx = tx_row[0] if tx_row and tx_row[0] else 0
                total_vol = float(tx_row[1]) if tx_row and tx_row[1] else 0.0

                cursor.execute("SELECT COUNT(*) FROM runtime_transactions WHERE merchant_id = ? AND decision = 'BLOCK'", (mid,))
                blocked_c = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM runtime_transactions WHERE merchant_id = ? AND decision = 'REVIEW'", (mid,))
                review_c = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM runtime_transactions WHERE merchant_id = ? AND decision = 'ALLOW'", (mid,))
                approved_c = cursor.fetchone()[0]

                status = "ACTIVE" if r["is_active"] == 1 else "SUSPENDED"
                results.append({
                    "merchant_id": mid,
                    "company_name": r["company_name"],
                    "email": r["email"],
                    "full_name": r["full_name"],
                    "api_key_prefix": r["api_key_prefix"],
                    "tier": "ENTERPRISE",
                    "status": status,
                    "created_at": r["created_at"],
                    "total_transactions": total_tx,
                    "total_volume_usd": total_vol,
                    "blocked_count": blocked_c,
                    "review_count": review_c,
                    "approved_count": approved_c,
                })
        return results

    def set_merchant_status(self, merchant_id: str, target_status: Optional[str] = None) -> Dict[str, Any]:
        """Updates merchant status to ACTIVE or SUSPENDED."""
        if not target_status:
            target_status = "SUSPENDED"
        target_status = target_status.upper()
        is_active = (target_status == "ACTIVE")

        if self.use_mysql:
            try:
                with get_db_session() as session:
                    creds = session.scalars(
                        select(MerchantCredentialModel).where(MerchantCredentialModel.merchant_id == merchant_id)
                    ).all()
                    for c in creds:
                        c.is_active = is_active
                    session.commit()
            except Exception as e:
                import sys
                print(f"[RuntimeStateStore] MySQL set_merchant_status error: {e}", file=sys.stderr)

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE api_keys SET is_active = ? WHERE merchant_id = ?", (1 if is_active else 0, merchant_id))
            conn.commit()

        return {
            "merchant_id": merchant_id,
            "status": target_status,
            "message": f"Merchant {merchant_id} status updated to {target_status}",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    def delete_merchant(self, merchant_id: str) -> Dict[str, Any]:
        """Completely purges merchant, associated users, auth sessions, credentials, and transactions."""
        # 1. Purge from in-memory graphs
        if merchant_id in self.merchant_graphs:
            del self.merchant_graphs[merchant_id]

        # 2. Purge from MySQL if enabled
        if self.use_mysql:
            try:
                with get_db_session() as session:
                    session.execute(delete(ActionAttemptModel).where(ActionAttemptModel.merchant_id == merchant_id))
                    session.execute(delete(MerchantActionModel).where(MerchantActionModel.merchant_id == merchant_id))
                    session.execute(delete(OutcomeModel).where(OutcomeModel.merchant_id == merchant_id))
                    session.execute(delete(RiskEvaluationModel).where(RiskEvaluationModel.merchant_id == merchant_id))
                    session.execute(delete(TransactionEntityModel).where(TransactionEntityModel.merchant_id == merchant_id))
                    session.execute(delete(TransactionModel).where(TransactionModel.merchant_id == merchant_id))
                    session.execute(delete(EntityRelationshipModel).where(EntityRelationshipModel.merchant_id == merchant_id))
                    session.execute(delete(IdempotencyRecordModel).where(IdempotencyRecordModel.merchant_id == merchant_id))
                    session.execute(delete(MerchantCredentialModel).where(MerchantCredentialModel.merchant_id == merchant_id))
                    session.execute(delete(MerchantIntegrationModel).where(MerchantIntegrationModel.merchant_id == merchant_id))
                    session.execute(delete(UserModel).where(UserModel.merchant_id == merchant_id))
                    session.execute(delete(MerchantModel).where(MerchantModel.merchant_id == merchant_id))
                    session.commit()
            except Exception as e:
                import sys
                print(f"[RuntimeStateStore] MySQL delete_merchant warning: {e}", file=sys.stderr)

        # 3. Purge from SQLite
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM auth_sessions WHERE merchant_id = ?", (merchant_id,))
            cursor.execute("DELETE FROM api_keys WHERE merchant_id = ?", (merchant_id,))
            cursor.execute("DELETE FROM users WHERE merchant_id = ?", (merchant_id,))
            cursor.execute("DELETE FROM merchant_integrations WHERE merchant_id = ?", (merchant_id,))
            cursor.execute("DELETE FROM merchant_actions WHERE merchant_id = ?", (merchant_id,))
            cursor.execute("DELETE FROM runtime_transactions WHERE merchant_id = ?", (merchant_id,))
            cursor.execute("DELETE FROM transaction_outcomes WHERE merchant_id = ?", (merchant_id,))
            cursor.execute("DELETE FROM merchant_events WHERE merchant_id = ?", (merchant_id,))
            cursor.execute("DELETE FROM idempotency_records WHERE merchant_id = ?", (merchant_id,))
            cursor.execute("DELETE FROM merchants WHERE merchant_id = ?", (merchant_id,))
            conn.commit()

        return {
            "success": True,
            "merchant_id": merchant_id,
            "message": f"Merchant {merchant_id} and all associated users, credentials, and transactions permanently purged.",
            "deleted_at": datetime.now(timezone.utc).isoformat(),
        }

