"""
Phase 14 Live MySQL End-to-End Demonstration Script.

Executes real risk evaluations, persists state in the database, extracts
33 point-in-time features, runs frozen Model F, and inspects database records.
"""

import sys
import os
import json
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.config import config
from src.integration.normalizer import EventNormalizer
from src.integration.feature_adapter import FeatureAdapter
from src.integration.schemas import RawTransactionEvent
from src.state.state_store import RuntimeStateStore
from src.decision.engine import RiskDecisionEngine
from src.db.database import check_db_connection


import argparse


def main():
    parser = argparse.ArgumentParser(description="Abuse-Ring Sentinel Phase 14 Demo")
    parser.add_argument("--engine", choices=["mysql", "sqlite"], default=None, help="Database engine to use for demo")
    args = parser.parse_args()

    print("=" * 70)
    print(" Abuse-Ring Sentinel — Phase 14 MySQL Live Persistence Demo")
    print("=" * 70)

    # 1. Check Database Health
    db_health = check_db_connection()
    print(f"[*] Database Health Probe: {db_health.get('status', 'unknown').upper()}")
    print(f"    Configured Engine: {db_health.get('engine')}")
    print(f"    Latency: {db_health.get('latency_ms', 0)} ms")
    if db_health.get("error"):
        print(f"    Note: {db_health.get('error')}")

    use_mysql = True
    if args.engine == "sqlite":
        use_mysql = False
    elif args.engine == "mysql":
        use_mysql = True
    else:
        use_mysql = (db_health.get("status") == "connected")

    print(f"[*] Running demo with state store backend: {'MySQL (Persistent)' if use_mysql else 'SQLite (Isolated Demo Engine)'}")

    # 2. Initialize Singletons
    store = RuntimeStateStore(use_mysql=use_mysql)
    normalizer = EventNormalizer()
    adapter = FeatureAdapter(state_store=store)
    engine = RiskDecisionEngine()

    merchant_id = "merchant_dev_01"
    now = datetime.now(timezone.utc)

    print(f"\n[+] Provisioned Merchant: {merchant_id}")

    # -------------------------------------------------------------------------
    # Scenario 1: Legitimate Single-Account Transaction
    # -------------------------------------------------------------------------
    print("\n" + "-" * 70)
    print(" Step 1: Evaluating Legitimate Established Customer (User A)")
    print("-" * 70)

    t1_time = (now - timedelta(minutes=10)).strftime("%Y-%m-%dT%H:%M:%SZ")
    raw1 = RawTransactionEvent(
        transaction_id="tx_legit_demo_101",
        user_id="user_alice_demo",
        amount=89.50,
        currency="INR",
        timestamp=t1_time,
        product_category="groceries",
        device_id="dev_alice_phone",
        ip_address="203.0.113.10",
        payment_method_id="pm_alice_card",
        shipping_address_id="addr_alice_home",
        billing_address_id="addr_alice_home",
        email_domain="alice@gmail.com",
    )

    c1 = normalizer.normalize(raw1)
    f1_dict, dq1 = adapter.extract_features(merchant_id, c1)
    eval1 = engine.evaluate_features(features=f1_dict, transaction_id=c1.transaction_id)

    store.record_evaluated_transaction(
        merchant_id=merchant_id,
        tx=c1,
        risk_score=eval1["risk_score"],
        decision=eval1["decision"],
        evaluated_at=datetime.utcnow().isoformat(),
        reason_codes=eval1["reason_codes"],
        evidence=eval1["evidence"],
        features=f1_dict,
    )

    print(f"  Transaction ID: {c1.transaction_id}")
    print(f"  Risk Score:     {eval1['risk_score']:.4f}")
    print(f"  Decision:       {eval1['decision']}")
    print(f"  Reason Codes:   {[r['code'] for r in eval1['reason_codes']]}")

    # -------------------------------------------------------------------------
    # Scenario 2: Historical Velocity Test (Same User 5 Mins Later)
    # -------------------------------------------------------------------------
    print("\n" + "-" * 70)
    print(" Step 2: Evaluating Second Transaction from User A (Point-in-Time History Test)")
    print("-" * 70)

    t2_time = (now - timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
    raw2 = RawTransactionEvent(
        transaction_id="tx_legit_demo_102",
        user_id="user_alice_demo",
        amount=120.00,
        currency="INR",
        timestamp=t2_time,
        product_category="fashion",
        device_id="dev_alice_phone",
        ip_address="203.0.113.10",
        payment_method_id="pm_alice_card",
        shipping_address_id="addr_alice_home",
        billing_address_id="addr_alice_home",
        email_domain="alice@gmail.com",
    )

    c2 = normalizer.normalize(raw2)
    f2_dict, dq2 = adapter.extract_features(merchant_id, c2)
    eval2 = engine.evaluate_features(features=f2_dict, transaction_id=c2.transaction_id)

    store.record_evaluated_transaction(
        merchant_id=merchant_id,
        tx=c2,
        risk_score=eval2["risk_score"],
        decision=eval2["decision"],
        evaluated_at=datetime.utcnow().isoformat(),
        reason_codes=eval2["reason_codes"],
        evidence=eval2["evidence"],
        features=f2_dict,
    )

    print(f"  Transaction ID:             {c2.transaction_id}")
    print(f"  User Historical Tx Count:   {f2_dict.get('user_historical_tx_count')} (Calculated from prior state)")
    print(f"  Risk Score:                 {eval2['risk_score']:.4f}")
    print(f"  Decision:                   {eval2['decision']}")

    # -------------------------------------------------------------------------
    # Scenario 3: Sybil Abuse Ring Collusion (New Account Sharing Device/IP/Payment)
    # -------------------------------------------------------------------------
    print("\n" + "-" * 70)
    print(" Step 3: Ingesting Coordinated Sybil Ring Collusion Attack")
    print("-" * 70)

    sybil_device = "dev_sybil_ring_shared_99"
    sybil_ip = "198.51.100.77"
    sybil_payment = "pm_sybil_card_99"

    # Pre-seed 3 prior accounts sharing the hardware
    for i in range(3):
        ts_prior = (now - timedelta(minutes=15 - i)).strftime("%Y-%m-%dT%H:%M:%SZ")
        r_pre = RawTransactionEvent(
            transaction_id=f"tx_sybil_prior_{i}",
            user_id=f"attacker_user_{i}",
            amount=499.00,
            currency="INR",
            timestamp=ts_prior,
            device_id=sybil_device,
            ip_address=sybil_ip,
            payment_method_id=sybil_payment,
            promo_code="DISCOUNT90",
        )
        c_pre = normalizer.normalize(r_pre)
        store.record_evaluated_transaction(merchant_id, c_pre, 0.98, "BLOCK", ts_prior)

    # Now evaluate new attacker account
    t3_time = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    raw3 = RawTransactionEvent(
        transaction_id="tx_sybil_attack_target",
        user_id="attacker_user_new",
        amount=899.00,
        currency="INR",
        timestamp=t3_time,
        product_category="electronics",
        device_id=sybil_device,
        ip_address=sybil_ip,
        payment_method_id=sybil_payment,
        promo_code="DISCOUNT90",
    )

    c3 = normalizer.normalize(raw3)
    f3_dict, dq3 = adapter.extract_features(merchant_id, c3)
    eval3 = engine.evaluate_features(features=f3_dict, transaction_id=c3.transaction_id)

    store.record_evaluated_transaction(
        merchant_id=merchant_id,
        tx=c3,
        risk_score=eval3["risk_score"],
        decision=eval3["decision"],
        evaluated_at=datetime.utcnow().isoformat(),
        reason_codes=eval3["reason_codes"],
        evidence=eval3["evidence"],
        features=f3_dict,
    )

    print(f"  Transaction ID:             {c3.transaction_id}")
    print(f"  Device Prior Users:         {f3_dict.get('device_prior_user_count')}")
    print(f"  IP Prior Users:             {f3_dict.get('ip_prior_user_count')}")
    print(f"  Payment Prior Users:        {f3_dict.get('payment_prior_user_count')}")
    print(f"  Prior Connected Users:      {f3_dict.get('number_of_prior_connected_users')}")
    print(f"  Risk Score:                 {eval3['risk_score']:.4f}")
    print(f"  Decision:                   {eval3['decision']} (Threshold tau*=0.90)")
    print(f"  Primary Reason Codes:       {[r['code'] for r in eval3['reason_codes']]}")

    # -------------------------------------------------------------------------
    # Scenario 4: Idempotency Demonstration
    # -------------------------------------------------------------------------
    print("\n" + "-" * 70)
    print(" Step 4: Demonstrating Idempotency Caching")
    print("-" * 70)
    idem_key = "idem_demo_key_777"
    response_data = {"transaction_id": c3.transaction_id, "risk_score": eval3["risk_score"], "decision": eval3["decision"]}
    store.save_idempotency_result(merchant_id, idem_key, c3.transaction_id, response_data)
    cached = store.get_idempotency_result(merchant_id, idem_key)
    print(f"  Idempotency Key: {idem_key}")
    print(f"  Cached Decision: {cached.get('decision')} (Zero duplicate inference execution)")

    # -------------------------------------------------------------------------
    # Scenario 5: Direct Database Summary Inspection
    # -------------------------------------------------------------------------
    print("\n" + "-" * 70)
    print(" Step 5: Database Summary & Persistent Row Counts")
    print("-" * 70)
    summary = store.get_database_summary()
    print(f"  Engine:   {summary.get('engine')}")
    print(f"  Status:   {summary.get('status')}")
    print(f"  Counts:   {json.dumps(summary.get('counts'), indent=4)}")

    print("\n" + "=" * 70)
    print(" [OK] Phase 14 Live Persistence Demo Finished Successfully.")
    print("=" * 70)


if __name__ == "__main__":
    main()
