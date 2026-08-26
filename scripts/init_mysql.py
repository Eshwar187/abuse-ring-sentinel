"""
MySQL Database Initialization Script for Abuse-Ring Sentinel.
Creates database (if not exists) and applies SQLAlchemy 2.0 schema models.
"""

import sys
import os
import pymysql

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.config import config
from src.db.database import get_engine, init_db, check_db_connection
from src.db.models import Base
from src.state.state_store import RuntimeStateStore


def create_database_if_not_exists(db_name: str) -> bool:
    """Attempts to connect to MySQL server root and create database if missing."""
    print(f"[*] Checking/creating database '{db_name}' on {config.mysql_host}:{config.mysql_port}...")
    try:
        ssl_kwargs = {"ssl": {"ssl_mode": "REQUIRED"}} if config.mysql_ssl_mode in ("REQUIRED", "VERIFY_CA", "VERIFY_IDENTITY") or "aiven" in config.mysql_host else {}
        conn = pymysql.connect(
            host=config.mysql_host,
            port=config.mysql_port,
            user=config.mysql_user,
            password=config.mysql_password,
            charset="utf8mb4",
            **ssl_kwargs,
        )
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.commit()
        conn.close()
        print(f"[+] Database '{db_name}' verified/created successfully.")
        return True
    except Exception as e:
        print(f"[!] Warning: Could not create database directly ({e}). Assuming database exists or user lacks CREATE DATABASE privileges.")
        return False


def main():
    print("=" * 65)
    print(" Abuse-Ring Sentinel — MySQL Schema Initialization (Phase 14)")
    print("=" * 65)

    # 1. Ensure databases exist
    create_database_if_not_exists(config.mysql_database)
    create_database_if_not_exists(config.mysql_test_database)

    # 2. Check connection
    print(f"[*] Probing database connection to '{config.mysql_database}'...")
    health = check_db_connection()
    if health.get("status") != "connected":
        print(f"[!] Database connection FAILED: {health.get('error')}")
        print("[!] Please verify MySQL is running and credentials in .env are correct.")
        sys.exit(1)

    print(f"[+] Database connected. Latency: {health.get('latency_ms')} ms")

    # 3. Create all tables
    print("[*] Initializing normalized MySQL schema tables...")
    try:
        init_db()
        print("[+] Tables initialized successfully:")
        for table in Base.metadata.tables.keys():
            print(f"    - {table}")
    except Exception as e:
        print(f"[!] Table creation failed: {e}")
        sys.exit(1)

    # 4. Seed default merchants
    print("[*] Seeding default development merchants and API keys...")
    store = RuntimeStateStore(use_mysql=True)
    summary = store.get_database_summary()
    print("[+] Database summary after initialization:")
    print(f"    Engine: {summary.get('engine')}")
    print(f"    Status: {summary.get('status')}")
    print(f"    Counts: {summary.get('counts')}")

    print("=" * 65)
    print(" [OK] MySQL Initialization Complete.")
    print("=" * 65)


if __name__ == "__main__":
    main()
