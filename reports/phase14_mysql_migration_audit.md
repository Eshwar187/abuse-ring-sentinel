# Phase 14 — MySQL Migration & Schema Evolution Audit

## 1. Scope of Migration

The objective of Phase 14 was to replace the in-memory/SQLite prototype state store with a production MySQL 8.x persistence layer while preserving all existing system contracts:
1. Frozen Model F artifact (`models/model_f.joblib` SHA-256: `a288f019a2693c04c5d6a2c454da4e9c9f7c54f1298b5777ab276cbca9a6dd9c`).
2. Held-out test dataset (`data/processed/test_features.csv` SHA-256: `be9b9f921948862a9fff52c9d6202bd2f6b1bf9c07a7725844bc2f5dad3a14cd`).
3. Exact 33 point-in-time features contract (`COMBINED_FEATURES`).
4. Production decision policy with fixed threshold $\tau^* = 0.90$.

---

## 2. Alembic Migration Structure

Alembic environment initialized in repository:
- `alembic.ini`: Configured for dynamic URL generation matching `src/config.py`.
- `alembic/env.py`: Integrated with SQLAlchemy `Base.metadata` to ensure all 13 tables are mapped.
- `alembic/versions/001_initial_mysql_schema.py`: Initial baseline migration containing DDL for all 13 normalized tables with indexes and unique constraints.

---

## 3. Database Layer Refactoring

### Modules Created & Upgraded:
1. **`src/db/models.py`**:
   - 13 SQLAlchemy 2.0 Declarative models.
2. **`src/db/database.py`**:
   - Connection factory, connection pool manager, `check_db_connection()` health probe.
3. **`src/db/repositories/`**:
   - `MerchantRepository`: Merchant tenant lifecycle, hashed API key resolution.
   - `TransactionRepository`: Transaction persistence, point-in-time lookback queries, velocity aggregations.
   - `EntityRepository`: Bipartite entity relationship graph persistence, prior user count queries.
   - `EvaluationRepository`: Model prediction scores, decisions, reason codes, and feature vector JSON storage.
   - `ActionRepository`: Outbound merchant webhook action tracking and attempt logging.
   - `OutcomeRepository`: Ground truth feedback.
   - `IdempotencyRepository`: Transaction deduplication.
   - `AuditRepository`: Security event logging.
4. **`src/state/state_store.py`**:
   - Refactored to route operations to MySQL repositories when `DB_ENGINE=mysql`.
   - Reconstructs in-memory NetworkX graph from MySQL `entity_relationships` on startup.
5. **`scripts/init_mysql.py`**:
   - Standalone CLI utility for verifying connection, provisioning schema, and seeding development credentials.
6. **`scripts/mysql_inspect.py`**:
   - Standalone CLI utility for real-time table inspection and row counting.

---

## 4. Graph Hydration & Restart Persistence

On application startup, `RuntimeStateStore` queries all records from `entity_relationships` for each active merchant and hydrates the bipartite graph in memory:
- Bipartite nodes: User accounts (`U:user_id`) and Entities (`E:DEVICE:dev_id`, `E:IP:ip`, `E:PAYMENT:pm_id`, `E:ADDRESS:addr_id`).
- Real-time updates: Every evaluated transaction writes new edges to `entity_relationships` in MySQL and immediately updates the in-memory graph.
- Restart resilience: Server restarts rebuild the exact same graph topology from persistent MySQL state.
