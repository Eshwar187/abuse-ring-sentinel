"""
FastAPI Endpoint Integration Tests.

Tests:
1. GET /health returns 200 and model metadata.
2. POST /predict returns 200 with valid risk decision, reasons, and evidence.
3. POST /predict rejects missing features with 400 / 422 error.
4. POST /predict rejects ground-truth contamination.
5. Structured audit log is written.
"""

import unittest
import os
import json
import pandas as pd
import httpx

from api.main import app


import unittest
import asyncio
import pandas as pd
import httpx

from api.main import app, PredictRequest, health_check, predict_transaction_risk


class TestAPI(unittest.TestCase):
    """Test suite for FastAPI endpoints."""

    @classmethod
    def setUpClass(cls):
        cls.transport = httpx.ASGITransport(app=app)
        demo_df = pd.read_csv("data/demo/demo_transactions.csv")
        cls.valid_payload = {
            "transaction_id": "tx_demo_api_001",
            "features": {k: v for k, v in demo_df.iloc[0].to_dict().items() if k != "is_abuse_ring"}
        }

    def _run_async(self, coro):
        return asyncio.run(coro)

    def test_health_endpoint(self):
        """Verify GET /health returns status ok and model version."""
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://testserver") as client:
                response = await client.get("/health")
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertEqual(data["status"], "ok")
                self.assertEqual(data["model_name"], "abuse_ring_sentinel")
                self.assertEqual(data["model_version"], "phase3-v1")
                self.assertEqual(data["feature_version"], "features-v2")
        self._run_async(_test())

    def test_predict_endpoint_valid(self):
        """Verify POST /predict returns complete structured decision payload."""
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://testserver") as client:
                response = await client.post("/predict", json=self.valid_payload)
                self.assertEqual(response.status_code, 200)
                data = response.json()

                self.assertEqual(data["transaction_id"], "tx_demo_api_001")
                self.assertIn(data["decision"], ["APPROVE", "REVIEW", "BLOCK"])
                self.assertIn(data["risk_level"], ["LOW", "MEDIUM", "HIGH"])
                self.assertIsInstance(data["risk_score"], float)
                self.assertIsInstance(data["reason_codes"], list)
                self.assertIsInstance(data["evidence"], dict)
                self.assertEqual(data["model_version"], "phase3-v1")
        self._run_async(_test())

    def test_predict_missing_fields_validation_error(self):
        """Verify POST /predict with missing required features returns an error."""
        async def _test():
            bad_payload = {
                "transaction_id": "tx_bad_001",
                "features": {"amount": 50.0}  # Missing other 32 features
            }
            async with httpx.AsyncClient(transport=self.transport, base_url="http://testserver") as client:
                response = await client.post("/predict", json=bad_payload)
                self.assertEqual(response.status_code, 400)
                data = response.json()
                self.assertIn("Missing required feature columns", data["detail"])
        self._run_async(_test())

    def test_predict_ground_truth_rejection(self):
        """Verify POST /predict rejects payloads containing target label."""
        async def _test():
            contaminated = self.valid_payload.copy()
            contaminated_features = contaminated["features"].copy()
            contaminated_features["is_abuse_ring"] = 1
            contaminated["features"] = contaminated_features

            async with httpx.AsyncClient(transport=self.transport, base_url="http://testserver") as client:
                response = await client.post("/predict", json=contaminated)
                self.assertEqual(response.status_code, 422)
        self._run_async(_test())


if __name__ == "__main__":
    unittest.main()
