# Phase 9 — Judge Presentation & Live Demo Script

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Duration**: 3–5 Minutes

---

## 🕒 Demo Timeline & Speaking Script

### **0:00 – 0:30 | The Problem: Invisible Sybil Fraud Rings**
- **Presenter**: *"Traditional risk engines evaluate checkouts in isolation. When fraud syndicates attack e-commerce merchants—harvesting promotional coupons, testing stolen credit cards, or executing chargeback fraud—they distribute transactions across hundreds of newly created accounts. Each transaction looks low-velocity and benign in isolation, making them invisible to legacy rules."*
- **Action**: Display the **Overview Dashboard** (`/dashboard`). Point out the high approval rate (99.11%) and clean separation.

---

### **0:30 – 1:00 | The Solution: Point-in-Time Behavioral + Graph Intelligence**
- **Presenter**: *"Abuse-Ring Sentinel solves this by fusing point-in-time behavioral velocity with incremental bipartite graph intelligence. Crucially, our system enforces strict temporal causality: zero future lookahead leakage. We evaluate 33 features against a frozen HistGradientBoosting model operating under a validation-tuned threshold of 0.90."*
- **Action**: Navigate to **Architecture / System Monitoring** (`/monitoring`). Show the frozen model specifications (`phase3-v1`, `features-v2`, `tau = 0.90`).

---

### **1:00 – 1:45 | Live Demo #1: The Coordinated Abuse Syndicate**
- **Presenter**: *"Let's test a live coordinated attack in our Interactive Risk Analyzer."*
- **Action**: 
  1. Open **Risk Analyzer** (`/risk-analyzer`).
  2. Click the preset: **"Coordinated Abuse Ring"**.
  3. Point out observable signals: `Account Age = 0.45 days`, `Device Prior Users = 7`, `Payment Prior Users = 6`, `Connected Users = 8`.
  4. Click **"Evaluate Transaction (POST /predict)"**.
- **Result**:
  - **Risk Score**: `100.00% (1.0000)`
  - **Decision**: **`BLOCK`**
  - **Reason Codes**: `GRAPH_CONNECTED_USERS`, `GRAPH_SHARED_DEVICE`, `GRAPH_SHARED_PAYMENT`, `HIGH_1H_VELOCITY`, `NEW_ACCOUNT`.
- **Presenter**: *"Notice how the decision engine immediately triggers an automated BLOCK with 5 ranked reason codes and exact feature evidence."*

---

### **1:45 – 2:30 | Live Demo #2: Safe Household Isolation (Zero False Declines)**
- **Presenter**: *"Now let's see how our system protects legitimate customers. What happens when family members share a home Wi-Fi and shipping address?"*
- **Action**:
  1. Click the preset: **"Legitimate Household"**.
  2. Point out: `IP Prior Users = 3`, `Address Prior Users = 3`, but `Device Prior Users = 0`, `Account Age = 85 days`.
  3. Click **"Evaluate Transaction"**.
- **Result**:
  - **Risk Score**: `0.00% (0.0000)`
  - **Decision**: **`APPROVE`**
  - **Primary Reason**: `LOW_RISK_ESTABLISHED_ACCOUNT`.
- **Presenter**: *"Unlike naive IP blacklists, Abuse-Ring Sentinel recognizes established tenure and unshared devices, authorizing the order with zero customer friction."*

---

### **2:30 – 3:15 | Dynamic Sensitivity & Graph Explorer**
- **Presenter**: *"Let's explore the relational graph behind these accounts."*
- **Action**: Navigate to **Entity Networks** (`/risk-networks`).
  - Show the dense cluster connecting multiple user nodes via shared devices and cards.
  - Show how benign households remain loosely connected and safe.

---

### **3:15 – 4:00 | Security, Hardening & Provenance Proof**
- **Presenter**: *"Every number in this dashboard is backed by real engineering:
  - 54 / 54 automated pytest tests passing.
  - Strict Pydantic anti-leakage guards rejecting target label injection.
  - Append-only audit logging with PII scrubbing in `reports/audit_log.jsonl`.
  - In our final held-out test of 6,929 transactions, Abuse-Ring Sentinel achieved 100% abuse recall (43/43 attacks blocked) and an 89.58% precision with only 5 false positives, delivering a 97.67% illustrative loss reduction."*
- **Action**: Show **System Health / Live Telemetry** (`/monitoring`) and **Audit Log** (`/audit`).

---

### **4:00 – 4:30 | Summary & Conclusion**
- **Presenter**: *"Abuse-Ring Sentinel is real, reproducible, defensively engineered, and ready for production deployment. Thank you!"*
