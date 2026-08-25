# Phase 13 Real Merchant Action Execution Demo Script

## 1. Quick Start Demonstration

### Step 1: Run the Automated Real-Merchant E2E Script
In a terminal, execute:
```bash
py scripts/phase13_real_merchant_demo.py
```

This will:
1. Provision a merchant tenant in Abuse-Ring Sentinel.
2. Configure the merchant's outbound webhook receiver with an HMAC-SHA256 signing secret.
3. Create pending orders in the Demo Merchant's SQLite database (`demo_merchant/orders.db`).
4. Dispatch raw checkout transactions to Sentinel's `POST /api/v1/risk/evaluate`.
5. Execute the frozen GBDT model, compute 33 features, and derive the risk decision (`BLOCK`).
6. Dispatch signed outbound HTTP webhooks to the Demo Merchant receiver.
7. Verify that the order state in the Demo Merchant database transitions from `PENDING` $\to$ `BLOCKED`.
8. Output the summary table.

---

## 2. Interactive Web UI Demonstration

### Step 1: Start Sentinel Backend
```bash
py -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

### Step 2: Start Demo Merchant Simulator (Optional Standalone)
```bash
py -m uvicorn demo_merchant.main:app --host 127.0.0.1 --port 8001 --reload
```

### Step 3: Start Angular Frontend
```bash
cd frontend
npm start
```
Open `http://localhost:4200` in your browser.

### Step 4: Test Connection in Integration Gateway
1. Navigate to **Integration Gateway** (`/app/integration`).
2. Verify the Webhook URL: `http://127.0.0.1:8001/api/risk/action`.
3. Click **"Test Merchant Connection"**.
4. Observe the green probe banner confirming `CONNECTED` status, HTTP 200, and measured latency.

### Step 5: Trigger a Live Evaluation & Action
1. Scroll to the **Interactive Checkout & Action Simulator**.
2. Click **"Sybil Attack"** preset.
3. Click **"Submit Evaluation (POST /api/v1/risk/evaluate)"**.
4. Observe:
   - Real calculated risk score and reason codes.
   - Merchant Action execution badge: `BLOCK_TRANSACTION` (`EXECUTED`).
5. Click **"Transactions"** $\to$ Select the transaction to inspect the **6-Step Lifecycle Timeline** and live action audit trail!
