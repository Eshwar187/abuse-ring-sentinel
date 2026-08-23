import sys
import os
sys.path.insert(0, os.path.abspath("."))
import json
import asyncio
import httpx
from api.main import app, rate_limiter

rate_limiter.client_records.clear()
transport = httpx.ASGITransport(app=app)

async def run_phase11_tests():
    results = {}
    async with httpx.AsyncClient(transport=transport, base_url="http://127.0.0.1:8000") as client:
        # 1. Health check
        res_health = await client.get("/health")
        print("=== 1. HEALTH CHECK ===")
        print(f"Status: {res_health.status_code}", res_health.json())
        assert res_health.status_code == 200
        health_data = res_health.json()
        assert health_data["status"] == "ok"
        assert health_data["model_type"] == "hist_gradient_boosting"
        results["health"] = health_data

        # 2. Low Risk Control
        with open("data/demo/phase7_controls/low_risk_control.json") as f:
            low_payload = json.load(f)
        res_low = await client.post("/predict", json=low_payload)
        print("\n=== 2. LOW RISK CONTROL INFERENCE ===")
        print(f"Status: {res_low.status_code}", res_low.json())
        assert res_low.status_code == 200
        low_data = res_low.json()
        assert low_data["decision"] == "APPROVE"
        assert low_data["risk_level"] == "LOW"
        assert 0.0 <= low_data["risk_score"] < 0.50
        assert "request_id" in low_data
        results["low_risk"] = {
            "score": low_data["risk_score"],
            "decision": low_data["decision"],
            "reasons": [r["code"] for r in low_data["reason_codes"]],
        }

        # 3. High Risk Control
        with open("data/demo/phase7_controls/high_risk_control.json") as f:
            high_payload = json.load(f)
        res_high = await client.post("/predict", json=high_payload)
        print("\n=== 3. HIGH RISK CONTROL INFERENCE ===")
        print(f"Status: {res_high.status_code}", res_high.json())
        assert res_high.status_code == 200
        high_data = res_high.json()
        assert high_data["decision"] == "BLOCK"
        assert high_data["risk_level"] == "HIGH"
        assert high_data["risk_score"] >= 0.90
        results["high_risk"] = {
            "score": high_data["risk_score"],
            "decision": high_data["decision"],
            "reasons": [r["code"] for r in high_data["reason_codes"]],
        }

        # 4. Dynamic Sensitivity Mutation Test
        mutated_payload = json.loads(json.dumps(high_payload))
        mutated_payload["transaction_id"] = "tx_phase11_mutated_ctrl"
        f = mutated_payload["features"]
        f["device_prior_user_count"] = 0
        f["ip_prior_user_count"] = 0
        f["payment_prior_user_count"] = 0
        f["shipping_address_prior_user_count"] = 0
        f["max_shared_entity_user_count"] = 0
        f["number_of_prior_connected_users"] = 0
        f["shared_entity_types_count"] = 0
        f["connected_component_user_count"] = 1
        f["connected_component_total_nodes"] = 1
        f["connected_component_edge_count"] = 0
        f["connected_component_density"] = 0.0
        f["account_age_days"] = 150.0
        f["user_tx_count_1h"] = 0
        f["user_tx_count_24h"] = 1
        f["user_tx_count_7d"] = 2
        f["email_domain"] = "gmail.com"
        f["is_promo_used"] = 0

        res_mutated = await client.post("/predict", json=mutated_payload)
        print("\n=== 4. DYNAMIC SENSITIVITY MUTATION ===")
        print(f"Status: {res_mutated.status_code}", res_mutated.json())
        assert res_mutated.status_code == 200
        mutated_data = res_mutated.json()
        assert mutated_data["decision"] == "APPROVE"
        assert mutated_data["risk_score"] < 0.50
        delta = mutated_data["risk_score"] - high_data["risk_score"]
        print(f"Baseline Score: {high_data['risk_score']} ({high_data['decision']})")
        print(f"Mutated Score:  {mutated_data['risk_score']} ({mutated_data['decision']})")
        print(f"Score Delta:    {delta:.4f}")
        results["sensitivity"] = {
            "baseline_score": high_data["risk_score"],
            "mutated_score": mutated_data["risk_score"],
            "delta": delta,
            "decision_shift": f"{high_data['decision']} -> {mutated_data['decision']}",
        }

        # 5. Live Metrics Summary
        res_metrics = await client.get("/metrics/summary")
        print("\n=== 5. LIVE METRICS SUMMARY ===")
        print(f"Status: {res_metrics.status_code}", res_metrics.json())
        assert res_metrics.status_code == 200
        metrics_data = res_metrics.json()
        assert metrics_data["total_inference_requests"] >= 3
        results["metrics"] = metrics_data

    # 6. Audit Log Inspection
    print("\n=== 6. AUDIT LOG RECORD INSPECTION ===")
    with open("reports/audit_log.jsonl", "r") as f_log:
        lines = [l.strip() for l in f_log if l.strip()]
    last_record = json.loads(lines[-1])
    print("Last audit record:")
    print(json.dumps(last_record, indent=2))
    assert "request_id" in last_record
    assert "latency_ms" in last_record
    assert "password" not in last_record
    assert "credit_card" not in last_record
    results["audit_log_verified"] = True

    return results

if __name__ == "__main__":
    out = asyncio.run(run_phase11_tests())
    print("\n[+] ALL PHASE 11 LOCAL INTEGRATION CHECKS PASSED SUCCESSFULLY.")
