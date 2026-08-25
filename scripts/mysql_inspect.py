"""
MySQL Database Inspection CLI for Abuse-Ring Sentinel.
Connects to configured MySQL database, runs real queries, and reports verified counts.
"""

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.config import config
from src.db.database import get_engine, get_db_session, check_db_connection
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
from sqlalchemy import select, func


def main():
    print("=" * 65)
    print(" Abuse-Ring Sentinel — MySQL Database Inspector (Phase 14)")
    print("=" * 65)

    health = check_db_connection()
    print(f"Engine:    {health.get('engine', 'mysql').upper()}")
    print(f"Host:      {config.mysql_host}:{config.mysql_port}")
    print(f"Database:  {health.get('database')}")
    print(f"Status:    {health.get('status', 'unknown').upper()}")
    print(f"Latency:   {health.get('latency_ms', 0.0)} ms")

    if health.get("status") != "connected":
        print(f"\n[!] Error: Database is disconnected: {health.get('error')}")
        sys.exit(1)

    print("-" * 65)
    print(f"{'Table Name':<32} | {'Row Count':<15}")
    print("-" * 65)

    tables_and_models = [
        ("merchants", MerchantModel),
        ("merchant_credentials", MerchantCredentialModel),
        ("merchant_integrations", MerchantIntegrationModel),
        ("transactions", TransactionModel),
        ("users", UserModel),
        ("transaction_entities", TransactionEntityModel),
        ("entity_relationships", EntityRelationshipModel),
        ("risk_evaluations", RiskEvaluationModel),
        ("merchant_actions", MerchantActionModel),
        ("action_attempts", ActionAttemptModel),
        ("outcomes", OutcomeModel),
        ("idempotency_records", IdempotencyRecordModel),
        ("audit_events", AuditEventModel),
    ]

    total_rows = 0
    with get_db_session() as session:
        for tbl_name, model in tables_and_models:
            count = session.scalar(select(func.count()).select_from(model)) or 0
            total_rows += count
            print(f"{tbl_name:<32} | {count:<15}")

        print("-" * 65)
        print(f"{'TOTAL ROWS ACROSS ALL TABLES':<32} | {total_rows:<15}")

        # Latest transaction details
        latest_tx = session.scalar(select(TransactionModel).order_by(TransactionModel.timestamp.desc()).limit(1))
        if latest_tx:
            print("-" * 65)
            print(f"Latest Transaction ID: {latest_tx.transaction_id}")
            print(f"Merchant ID:           {latest_tx.merchant_id}")
            print(f"User ID:               {latest_tx.user_id}")
            print(f"Amount:                ₹{latest_tx.amount:,.2f}")
            print(f"Timestamp:             {latest_tx.timestamp}")
        else:
            print("-" * 65)
            print("No transactions recorded yet in this database.")

    print("=" * 65)


if __name__ == "__main__":
    main()
