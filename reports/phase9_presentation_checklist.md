# Phase 9 — Presentation & Screenshot Checklist

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager

---

## 📸 Key UI Views & Screen Checklist

| Screen / View | Primary Focus | Key Elements to Highlight | Status |
| :--- | :--- | :--- | :--- |
| **1. Overview Dashboard** (`/dashboard`) | Operational merchant health | 5 KPI tiles, ECharts risk separation histogram, decision donut, high-risk activity table. | **VERIFIED** |
| **2. Risk Analyzer — Abuse** (`/risk-analyzer`) | Live attack detection | Score `100.00%`, `BLOCK` badge, ranked reason codes (`GRAPH_CONNECTED_USERS`, `GRAPH_SHARED_DEVICE`), feature evidence. | **VERIFIED** |
| **3. Risk Analyzer — Benign** (`/risk-analyzer`) | False alarm protection | Score `0.00%`, `APPROVE` badge, household shared Wi-Fi / address handled cleanly. | **VERIFIED** |
| **4. Explainability Panel** (`/risk-analyzer`) | Transparent reasoning | Direct mapping between observed feature values and triggered reason messages. | **VERIFIED** |
| **5. Entity Network Topology** (`/risk-networks`) | Relational graph visualization | Cytoscape.js heterogeneous graph (Users, Devices, IPs, Payments, Addresses) showing mesh vs star clusters. | **VERIFIED** |
| **6. Transactions Table** (`/transactions`) | Investigation workflow | Real-time search, risk filter tabs, compact risk meters, inspect drawer. | **VERIFIED** |
| **7. Transaction Forensic Detail** (`/transactions/:id`) | Deep audit inspection | 3-step timeline, feature breakdown by category, metadata stamps. | **VERIFIED** |
| **8. System Telemetry & Health** (`/monitoring`) | Real-time observability | Live requests, latency percentiles, error rate, model registry governance. | **VERIFIED** |
| **9. Compliance Audit Console** (`/audit`) | Regulatory compliance | Append-only event stream, request ID correlation, PII-scrubbed evidence inspection. | **VERIFIED** |

---

## 🛠️ Pre-Presentation Setup Checklist

- [x] Python virtual environment activated
- [x] Dependencies installed (`py -m pip install -r requirements.txt`)
- [x] All 54 pytest tests passing (`py -m pytest tests/ -v`)
- [x] Angular production build verified (`npm run build` in `frontend/`)
- [x] Backend running on `http://localhost:8000` (`py -m uvicorn api.main:app --host 0.0.0.0 --port 8000`)
- [x] Frontend accessible at `http://localhost:4200` (or `http://localhost:8000`)
- [x] Live `GET /health` returns `200 OK`
- [x] Live `GET /metrics/summary` returns live telemetry
- [x] Demo presets in Risk Analyzer trigger real API inference
