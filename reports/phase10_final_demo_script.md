# Phase 10 — Final Judge Presentation & Live Demo Script

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Target Duration**: 3–5 Minutes

---

## 🎯 Presentation Sequence

### **1. Problem & Context (0:00 – 0:45)**
- *“E-commerce merchants lose billions annually to coordinated abuse rings that exploit promotional vouchers, test stolen payment cards, and commit chargeback fraud. These syndicates operate by distributing transactions across hundreds of newly created accounts. Evaluated in isolation, each transaction appears low-velocity and benign.”*
- **Visual**: Show the **Overview Dashboard** (`/dashboard`).

---

### **2. Core Innovation: Point-in-Time Behavioral + Relational Graph GBDT (0:45 – 1:30)**
- *“Abuse-Ring Sentinel combines point-in-time behavioral features with incremental bipartite entity graphs. Most importantly, we enforce strict temporal causality: zero future lookahead. Our frozen HistGradientBoosting model evaluates 33 point-in-time features in ~4ms under a validation-optimized 0.90 threshold.”*
- **Visual**: Show **System & Operational Monitoring** (`/monitoring`) with live telemetry and frozen model governance metadata.

---

### **3. Live Demo #1: High-Risk Sybil Syndicate (1:30 – 2:30)**
- *“Let's evaluate a live attack in our Interactive Studio.”*
- **Action**: In `/risk-analyzer`, click preset **“Coordinated Abuse Ring”** $\to$ click **“Evaluate Transaction”**.
- **Observation**:
  - **Risk Score**: `100.00%`
  - **Decision**: **`BLOCK`**
  - **Reason Codes**: `GRAPH_CONNECTED_USERS`, `GRAPH_SHARED_DEVICE`, `GRAPH_SHARED_PAYMENT`, `HIGH_1H_VELOCITY`, `NEW_ACCOUNT`.
- *“The system detects that while this account is only 10 hours old, it is connected to 8 prior users and shares 7 devices and 6 cards. It immediately blocks the checkout with 5 clear, evidence-backed reason codes.”*

---

### **4. Live Demo #2: Safe Household Isolation (2:30 – 3:15)**
- *“Now let's test a legitimate household sharing home Wi-Fi and shipping addresses.”*
- **Action**: In `/risk-analyzer`, click preset **“Legitimate Household”** $\to$ click **“Evaluate Transaction”**.
- **Observation**:
  - **Risk Score**: `0.00%`
  - **Decision**: **`APPROVE`**
  - **Primary Reason**: `LOW_RISK_ESTABLISHED_ACCOUNT`.
- *“Because our graph distinguishes between device co-usage and residential Wi-Fi, established family members are approved with zero friction.”*

---

### **5. Live Graph & Investigation Explorer (3:15 – 4:00)**
- **Action**: Open `/risk-networks` (Cytoscape graph) and `/transactions` (Investigation console).
- *“Merchants can visually inspect the entity cluster connecting devices, IPs, and payment cards, drill down into transaction timelines, and review append-only compliance logs.”*

---

### **6. Rigor, Security & Conclusion (4:00 – 4:30)**
- *“Abuse-Ring Sentinel is verified:
  - 54 / 54 passing automated tests
  - Zero target leakage and rate-limited FastAPI endpoints
  - In our held-out test of 6,929 transactions, it caught 100% of abuse attacks (43/43) with an 89.58% precision and 97.67% illustrative cost reduction.
  Thank you!”*
