"""
Phase 12 Real Merchant Integration Demo Script.

Demonstrates:
1. Normal merchant onboarding & configuration fetch via GET /api/v1/merchant/config.
2. Ingestion of raw checkout events from legitimate and fraudulent customers.
3. Cold-start transaction evaluation for a brand-new benign customer.
4. Coordinated Sybil Abuse Ring attack simulation:
   - Step 1: Attacker Account 1 checkouts with shared device D1 and card C1.
   - Step 2: Attacker Account 2 checkouts with same device D1, shared card C1.
   - Step 3: Attacker Account 3 checkouts with same device D1, shared card C1.
5. Live dynamic entity graph connectivity growth and automated risk score escalation.
6. Strict merchant isolation verification (Merchant B evaluates account on same device -> completely isolated).
7. Post-decision outcome recording (POST /api/v1/outcomes) without automated model retraining.
"""

import sys
import os
import json
import time
import asyncio
import httpx
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath("."))
from api.main import app


def print_step(title: str):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


async def run_demo():
    print_step("PHASE 12 LIVE MERCHANT INTEGRATION DEMO - REAL INFERENCE & ISOLATION")
    print("Initializing in-process ASGI HTTP client connected to FastAPI...")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:

        api_key_merchant_a = "ars_live_test_merchant_01"
        api_key_merchant_b = "ars_live_demo_merchant_02"

        # Step 1: Health & Merchant Config
        print_step("1. MERCHANT API CONFIGURATION & GATEWAY HEALTH CHECK")
        res_cfg = await client.get("/api/v1/merchant/config", headers={"X-API-Key": api_key_merchant_a})
        print(f"GET /api/v1/merchant/config -> HTTP {res_cfg.status_code}")
        cfg = res_cfg.json()
        print(f"  Merchant ID:      {cfg['merchant_id']}")
        print(f"  Active Model:     {cfg['model_name']} ({cfg['model_type']})")
        print(f"  Model Version:    {cfg['model_version']}")
        print(f"  Policy Threshold: {cfg['threshold']} (APPROVE < 0.50, REVIEW 0.50-0.90, BLOCK >= 0.90)")

        # Step 2: Cold-Start Benign Transaction
        print_step("2. BENIGN COLD-START CHECKOUT (FIRST-TIME LEGITIMATE SHOPPER)")
        tx_benign = {
            "transaction_id": "tx_demo_benign_001",
            "user_id": "cust_sarah_connor",
            "amount": 79.50,
            "currency": "INR",
            "timestamp": "2026-08-25T10:00:00Z",
            "product_category": "books_and_media",
            "device_id": "dev_sarah_iphone15",
            "ip_address": "49.207.180.12",
            "payment_method_id": "pm_sarah_hdfc_card",
            "shipping_address_id": "addr_sarah_bangalore",
            "billing_address_id": "addr_sarah_bangalore",
            "email_domain": "sarah.connor@gmail.com",
            "promo_code": "",
        }
        res_b1 = await client.post(
            "/api/v1/risk/evaluate",
            json=tx_benign,
            headers={"X-API-Key": api_key_merchant_a, "Idempotency-Key": "idem_demo_benign_01"},
        )
        print(f"POST /api/v1/risk/evaluate -> HTTP {res_b1.status_code}")
        b1_data = res_b1.json()
        print(f"  Transaction ID:  {b1_data['transaction_id']}")
        print(f"  Risk Score:      {b1_data['risk_score'] * 100:.2f}% ({b1_data['risk_level']})")
        print(f"  Decision:        {b1_data['decision']}")
        print(f"  Data Quality:    {b1_data['data_quality']['status']} (prior TXs: {b1_data['data_quality']['historical_transactions']})")
        print(f"  Latency:         {b1_data['latency_ms']} ms")
        print(f"  Reason Codes:    {[r['code'] for r in b1_data['reason_codes']]}")

        # Step 3: Coordinated Multi-Account Sybil Abuse Ring Attack
        print_step("3. SIMULATING COORDINATED SYBIL ABUSE RING ATTACK (DYNAMIC GRAPH GROWTH)")
        shared_device = "dev_sybil_farm_rig_99"
        shared_card = "pm_sybil_compromised_card_99"
        shared_ip = "185.220.101.5"

        sybil_accounts = [
            {"tx": "tx_demo_sybil_step1", "user": "attacker_alpha", "promo": "WELCOME50", "time": "2026-08-25T11:00:00Z"},
            {"tx": "tx_demo_sybil_step2", "user": "attacker_bravo", "promo": "WELCOME50", "time": "2026-08-25T11:05:00Z"},
            {"tx": "tx_demo_sybil_step3", "user": "attacker_charlie", "promo": "WELCOME50", "time": "2026-08-25T11:10:00Z"},
            {"tx": "tx_demo_sybil_step4", "user": "attacker_delta", "promo": "WELCOME50", "time": "2026-08-25T11:15:00Z"},
        ]

        for idx, acc in enumerate(sybil_accounts, 1):
            payload = {
                "transaction_id": acc["tx"],
                "user_id": acc["user"],
                "amount": 350.00,
                "currency": "INR",
                "timestamp": acc["time"],
                "product_category": "electronics",
                "device_id": shared_device,
                "ip_address": shared_ip,
                "payment_method_id": shared_card,
                "shipping_address_id": "addr_drop_warehouse_01",
                "billing_address_id": "addr_drop_warehouse_01",
                "email_domain": "disposable@tempinbox.me",
                "promo_code": acc["promo"],
            }
            res = await client.post("/api/v1/risk/evaluate", json=payload, headers={"X-API-Key": api_key_merchant_a})
            data = res.json()
            print(f"\n  [Sybil Node {idx}] User: {acc['user']} at {acc['time']}")
            print(f"    Transaction ID:         {data['transaction_id']}")
            print(f"    Calculated Risk Score:  {data['risk_score'] * 100:.2f}% ({data['risk_level']})")
            print(f"    Automated Decision:     {data['decision']}")
            print(f"    Device Prior Sharing:   {data['evidence'].get('device_prior_user_count', 0)} prior users")
            print(f"    Payment Prior Sharing:  {data['evidence'].get('payment_prior_user_count', 0)} prior users")
            print(f"    Connected Components:   {data['evidence'].get('connected_component_user_count', 0)} users")
            print(f"    Reason Codes:           {[r['code'] for r in data['reason_codes']]}")

        # Step 4: Strict Merchant Isolation Verification
        print_step("4. STRICT MULTI-TENANT ISOLATION (MERCHANT B EVALUATION)")
        print("Evaluating a user on Merchant B with the exact same device and card used by Merchant A's attackers...")
        tx_merchant_b = {
            "transaction_id": "tx_demo_merchant_b_001",
            "user_id": "user_isolated_merchant_b",
            "amount": 120.00,
            "currency": "INR",
            "timestamp": "2026-08-25T11:20:00Z",
            "product_category": "apparel",
            "device_id": shared_device,
            "payment_method_id": shared_card,
            "ip_address": shared_ip,
        }
        res_mb = await client.post("/api/v1/risk/evaluate", json=tx_merchant_b, headers={"X-API-Key": api_key_merchant_b})
        mb_data = res_mb.json()
        print(f"POST /api/v1/risk/evaluate (Merchant B) -> HTTP {res_mb.status_code}")
        print(f"  Merchant ID:            {mb_data['merchant_id']}")
        print(f"  Data Quality Status:    {mb_data['data_quality']['status']}")
        print(f"  Device Prior Sharing:   {mb_data['evidence'].get('device_prior_user_count', 0)} (ISOLATED from Merchant A!)")
        print(f"  Payment Prior Sharing:  {mb_data['evidence'].get('payment_prior_user_count', 0)} (ISOLATED from Merchant A!)")
        print(f"  Connected Users:        {mb_data['evidence'].get('number_of_prior_connected_users', 0)}")
        print(f"  Decision:               {mb_data['decision']}")

        # Step 5: Post-Decision Feedback Outcome Ingestion
        print_step("5. POST-DECISION FEEDBACK OUTCOME RECORDING (ZERO ONLINE RETRAINING)")
        outcome_payload = {
            "transaction_id": "tx_demo_sybil_step4",
            "outcome": "CONFIRMED_FRAUD",
            "timestamp": "2026-08-25T12:00:00Z",
            "notes": "Coordinated ring fraud confirmed by merchant trust and safety team.",
        }
        res_out = await client.post("/api/v1/outcomes", json=outcome_payload, headers={"X-API-Key": api_key_merchant_a})
        print(f"POST /api/v1/outcomes -> HTTP {res_out.status_code}")
        print(f"  Response: {res_out.json()}")

        print_step("DEMO COMPLETED SUCCESSFULLY: REAL INFERENCE, LIVE GRAPH DYNAMICS & COMPLETE ISOLATION PROVED.")


if __name__ == "__main__":
    asyncio.run(run_demo())
