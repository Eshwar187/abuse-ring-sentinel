"""
VigilAI - Comprehensive Manual AI Testing Suite & Interactive Simulator.

Run this script to test the model against edge cases, attack vectors,
and benign scenarios, or interactively input custom checkout values.
"""

import sys
import io
import time
from typing import Dict, Any

# Ensure UTF-8 stdout for Windows console
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from src.decision.engine import RiskDecisionEngine

BENCHMARK_SCENARIOS = {
    "1": {
        "name": "🚨 Coordinated Abuse Ring (Sybil Attack / Device Farm)",
        "description": "Bot farm creating new accounts with recycled device IDs and payment tokens.",
        "payload": {
            "transaction_id": "tx_attack_sybil_001",
            "amount": 499.00,
            "product_category": "electronics",
            "is_promo_used": 1,
            "account_age_days": 0.05,
            "email_domain": "trashmail.com",
            "user_tx_count_1h": 8,
            "user_tx_count_24h": 22,
            "hour_of_day": 3,
            "device_prior_user_count": 14,
            "ip_prior_user_count": 18,
            "payment_prior_user_count": 8,
            "number_of_prior_connected_users": 16,
        },
        "expected_decision": "BLOCK",
    },
    "2": {
        "name": "⚡ Promo Code & Voucher Exploitation Bot",
        "description": "High-velocity voucher redemption attempting promo stacking on new identity.",
        "payload": {
            "transaction_id": "tx_attack_promo_002",
            "amount": 49.99,
            "product_category": "gift_cards",
            "is_promo_used": 1,
            "account_age_days": 0.20,
            "email_domain": "temp-inbox.net",
            "user_tx_count_1h": 12,
            "user_tx_count_24h": 12,
            "hour_of_day": 2,
            "device_prior_user_count": 6,
            "ip_prior_user_count": 8,
            "payment_prior_user_count": 2,
            "number_of_prior_connected_users": 6,
        },
        "expected_decision": "BLOCK",
    },
    "3": {
        "name": "💳 Card Testing / Payment Token Recycling",
        "description": "Stolen credit card tested across multiple newly registered accounts.",
        "payload": {
            "transaction_id": "tx_attack_card_003",
            "amount": 15.00,
            "product_category": "digital_goods",
            "is_promo_used": 0,
            "account_age_days": 0.50,
            "email_domain": "burnermail.org",
            "user_tx_count_1h": 5,
            "user_tx_count_24h": 7,
            "hour_of_day": 4,
            "device_prior_user_count": 4,
            "ip_prior_user_count": 5,
            "payment_prior_user_count": 9,
            "number_of_prior_connected_users": 9,
        },
        "expected_decision": "BLOCK",
    },
    "4": {
        "name": "🟡 Borderline Transaction (Triggers Step-Up 2FA)",
        "description": "Unusual night-time order on a relatively fresh account, moderate velocity.",
        "payload": {
            "transaction_id": "tx_borderline_004",
            "amount": 350.00,
            "product_category": "electronics",
            "is_promo_used": 1,
            "account_age_days": 0.80,
            "email_domain": "gmail.com",
            "user_tx_count_1h": 3,
            "user_tx_count_24h": 5,
            "hour_of_day": 1,
            "device_prior_user_count": 3,
            "ip_prior_user_count": 4,
            "payment_prior_user_count": 2,
            "number_of_prior_connected_users": 3,
        },
        "expected_decision": "REVIEW",
    },
    "5": {
        "name": "🏠 Benign Shared Family Household (False Positive Test)",
        "description": "Multiple family members sharing home Wi-Fi IP and tablet, but distinct legitimate cards.",
        "payload": {
            "transaction_id": "tx_benign_family_005",
            "amount": 112.50,
            "product_category": "groceries",
            "is_promo_used": 0,
            "account_age_days": 180.0,
            "email_domain": "yahoo.com",
            "user_tx_count_1h": 1,
            "user_tx_count_24h": 1,
            "hour_of_day": 18,
            "device_prior_user_count": 2,
            "ip_prior_user_count": 4,
            "payment_prior_user_count": 1,
            "number_of_prior_connected_users": 0,
        },
        "expected_decision": "APPROVE",
    },
    "6": {
        "name": "🟢 Established VIP Shopper (Trusted Baseline)",
        "description": "Tenured account (> 1 year), regular shopping history, single device lineage.",
        "payload": {
            "transaction_id": "tx_benign_vip_006",
            "amount": 89.00,
            "product_category": "apparel",
            "is_promo_used": 0,
            "account_age_days": 420.0,
            "email_domain": "icloud.com",
            "user_tx_count_1h": 0,
            "user_tx_count_24h": 1,
            "hour_of_day": 14,
            "device_prior_user_count": 1,
            "ip_prior_user_count": 1,
            "payment_prior_user_count": 1,
            "number_of_prior_connected_users": 0,
        },
        "expected_decision": "APPROVE",
    },
}


def print_banner():
    print("\n" + "=" * 75)
    print(" 🛡️   VIGILAI -- ADVANCED MANUAL RISK ENGINE TEST SUITE")
    print("     HistGradientBoosting Model F (Decision Threshold: tau* = 0.90)")
    print("=" * 75)


def run_scenario(engine: RiskDecisionEngine, scenario_key: str, scenario_data: Dict[str, Any]):
    print("\n" + "-" * 75)
    print(f"SCENARIO [{scenario_key}]: {scenario_data['name']}")
    print(f"Context: {scenario_data['description']}")
    print("-" * 75)

    payload = scenario_data["payload"]
    print(f"Inbound Point-in-Time Features:")
    print(f"  • Amount:              ${payload.get('amount', 0):.2f} ({payload.get('product_category', 'general')})")
    print(f"  • Account Age:         {payload.get('account_age_days', 0):.2f} days (Domain: {payload.get('email_domain')})")
    print(f"  • 1h / 24h Velocity:   {payload.get('user_tx_count_1h', 0)} / {payload.get('user_tx_count_24h', 0)} attempts")
    print(f"  • Device Prior Users:  {payload.get('device_prior_user_count', 0)}")
    print(f"  • IP Prior Users:      {payload.get('ip_prior_user_count', 0)}")
    print(f"  • Payment Card Users:  {payload.get('payment_prior_user_count', 0)}")
    print(f"  • Graph Cluster Nodes: {payload.get('number_of_prior_connected_users', 0)} connected accounts")

    start = time.perf_counter()
    result = engine.evaluate_features(payload)
    latency_ms = (time.perf_counter() - start) * 1000.0

    score = result["risk_score"]
    decision = result["decision"]
    level = result["risk_level"]
    reasons = [r["code"] for r in result["reason_codes"]]

    if decision == "BLOCK":
        badge = "🔴 [BLOCK]"
    elif decision == "REVIEW":
        badge = "🟡 [REVIEW - STEP UP 2FA]"
    else:
        badge = "🟢 [APPROVE]"

    print(f"\nAI Inference Result:")
    print(f"  • Fraud Risk Score:   {score:.4f} ({score * 100:.2f}%)")
    print(f"  • Risk Decision:       {badge} (Level: {level})")
    print(f"  • Inference Latency:   {latency_ms:.2f} ms")
    print(f"  • Reason Explanations: {reasons}")

    expected = scenario_data.get("expected_decision")
    if expected:
        passed = (decision == expected)
        status_txt = "✅ MATCHES POLICY TARGET" if passed else f"❌ MISMATCH (Expected {expected})"
        print(f"  • Benchmark Check:     {status_txt}")
    print("-" * 75)


def run_all_scenarios(engine: RiskDecisionEngine):
    print("\n>>> EXECUTING ALL 6 BENCHMARK ATTACK & BENIGN PROFILES <<<\n")
    for key, data in BENCHMARK_SCENARIOS.items():
        run_scenario(engine, key, data)
        time.sleep(0.1)


def run_custom_interactive(engine: RiskDecisionEngine):
    print("\n" + "=" * 75)
    print(" 🛠️  CUSTOM INTERACTIVE TRANSACTION EVALUATOR")
    print("     Enter custom checkout values to see how Model F evaluates them.")
    print("=" * 75)

    try:
        tx_id = input("Transaction ID [tx_custom_test]: ").strip() or "tx_custom_test"
        amt_str = input("Amount ($) [199.99]: ").strip() or "199.99"
        amount = float(amt_str)
        category = input("Product category [electronics/apparel/groceries] [electronics]: ").strip() or "electronics"
        promo_str = input("Promo Used? (1 for Yes, 0 for No) [0]: ").strip() or "0"
        is_promo = int(promo_str)
        age_str = input("Account Age in Days [0.1 for brand new, 180 for established] [1.0]: ").strip() or "1.0"
        age_days = float(age_str)
        domain = input("Email Domain [gmail.com / trashmail.com] [gmail.com]: ").strip() or "gmail.com"
        v1h_str = input("Transactions in last 1 hour [1]: ").strip() or "1"
        v1h = int(v1h_str)
        dev_users_str = input("Number of distinct accounts seen on this Device [1]: ").strip() or "1"
        dev_users = int(dev_users_str)
        ip_users_str = input("Number of distinct accounts seen on this IP [1]: ").strip() or "1"
        ip_users = int(ip_users_str)
        pay_users_str = input("Number of distinct accounts seen on this Payment Card [1]: ").strip() or "1"
        pay_users = int(pay_users_str)
        conn_users_str = input("Number of connected accounts in Entity Graph [0]: ").strip() or "0"
        conn_users = int(conn_users_str)

        custom_payload = {
            "transaction_id": tx_id,
            "amount": amount,
            "product_category": category,
            "is_promo_used": is_promo,
            "account_age_days": age_days,
            "email_domain": domain,
            "user_tx_count_1h": v1h,
            "device_prior_user_count": dev_users,
            "ip_prior_user_count": ip_users,
            "payment_prior_user_count": pay_users,
            "number_of_prior_connected_users": conn_users,
        }

        custom_scenario = {
            "name": f"User Custom Payload: {tx_id}",
            "description": "User-defined transactional & graph feature profile",
            "payload": custom_payload,
        }
        run_scenario(engine, "CUSTOM", custom_scenario)

    except Exception as e:
        print(f"Error reading input: {e}")


def main():
    print_banner()
    print("[*] Initializing VigilAI RiskDecisionEngine (Frozen Model F)...")
    engine = RiskDecisionEngine()
    print("[✓] Model F Engine Loaded and Ready!")

    if len(sys.argv) > 1 and sys.argv[1] == "--all":
        run_all_scenarios(engine)
        return

    while True:
        print("\nSelect a testing option:")
        print("  [1] 🚨 Coordinated Abuse Ring (Sybil Attack)")
        print("  [2] ⚡ Promo Code & Voucher Exploitation Bot")
        print("  [3] 💳 Card Testing / Payment Token Recycling")
        print("  [4] 🟡 Borderline Transaction (Step-Up 2FA)")
        print("  [5] 🏠 Benign Shared Family Household (False Positive Test)")
        print("  [6] 🟢 Established VIP Shopper (Trusted Baseline)")
        print("  [A] 🚀 Run ALL 6 Benchmark Scenarios")
        print("  [C] 🛠️  Custom Transaction Builder (Type your own features)")
        print("  [Q] ❌ Quit")

        choice = input("\nEnter choice [1-6, A, C, Q]: ").strip().upper()
        if choice == "Q":
            print("\nExiting VigilAI Test Suite. Stay secure!\n")
            break
        elif choice == "A":
            run_all_scenarios(engine)
        elif choice == "C":
            run_custom_interactive(engine)
        elif choice in BENCHMARK_SCENARIOS:
            run_scenario(engine, choice, BENCHMARK_SCENARIOS[choice])
        else:
            print("Invalid selection. Please choose a valid option.")


if __name__ == "__main__":
    main()
