# Phase 9 — Frontend Architecture & Polish Audit

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: August 23, 2026  
**Auditor**: Lead Frontend & Product Experience Engineer

---

## 1. Current Frontend Architecture

The Abuse-Ring Sentinel frontend is built on **Angular 19** with standalone components, TypeScript, Tailwind CSS, Lucide icons, Apache ECharts, and Cytoscape.js.

```
frontend/src/app/
├── core/
│   ├── models/risk.models.ts         (Typed interfaces: PredictRequest, PredictResponse, AuditRecord, etc.)
│   └── services/
│       ├── api.service.ts            (HttpClient base transport + error interceptor)
│       ├── health.service.ts         (GET /health and GET /metrics/summary poller)
│       ├── risk.service.ts           (POST /predict and scenario execution manager)
│       └── transaction.service.ts    (Transaction query, filter, and audit store)
├── features/
│   ├── dashboard/                    (Operational overview + live metrics vs held-out benchmarks)
│   ├── risk-analyzer/                (Primary interactive evaluation demo studio)
│   ├── transactions/                 (Searchable evaluation records & detail views)
│   ├── risk-networks/                (Cytoscape.js heterogeneous entity graph explorer)
│   ├── monitoring/                   (Real-time telemetry, model specifications, latency percentiles)
│   └── audit/                        (Regulatory compliance audit log)
├── layout/
│   ├── header/                       (Live health indicator, global search, quick stats)
│   ├── sidebar/                      (Primary navigation with operational status)
│   └── shell/                        (Main layout wrapper)
└── shared/
    └── components/                   (RiskBadge, DecisionBadge, ScoreMeter, MetricCard)
```

---

## 2. Reusable Components Assessment

| Component | Status | Role | Polish / Enhancement in Phase 9 |
| :--- | :--- | :--- | :--- |
| `ScoreMeterComponent` | **EXCELLENT** | Visual horizontal / radial score meter. | Enhanced with clear demarcations for LOW (0.00–0.50), MEDIUM (0.50–0.90), HIGH (0.90–1.00). |
| `DecisionBadgeComponent` | **EXCELLENT** | Semantic pill badge (`APPROVE`, `REVIEW`, `BLOCK`). | Refined with fintech-style micro-borders and subtle contrast icons. |
| `RiskBadgeComponent` | **EXCELLENT** | Severity tag (`LOW`, `MEDIUM`, `HIGH`). | Verified accessible contrast ratios. |
| `MetricCardComponent` | **EXCELLENT** | KPI summary tile. | Integrated live metrics vs benchmark disclosure tags. |

---

## 3. UI Weaknesses Identified & Polish Plan

1. **Dashboard Data Clarification**: Ensure dashboard explicitly distinguishes between **Live Session Inferences** and **Phase 5 Frozen Held-Out Benchmarks** ($N=6,929$).
2. **Risk Analyzer UX (Primary Demo)**:
   - Provide grouped input panels (Customer Behavior, Account Profile, Entity Sharing, Graph Signals, Transaction Context).
   - Ensure demo scenario buttons directly trigger real `POST /predict` calls through `RiskService`.
   - Provide clear, accessible skeleton loaders and zero fake prediction fallback on error.
3. **Graph Signals Visualization**: Ensure the Cytoscape graph dynamically reflects graph-derived signals (connected components, shared devices, shared IPs) accurately without simulating fake backend edges.
4. **System Health & Monitoring**: Connect directly to `GET /metrics/summary` to show live inference counts, latency percentiles, and approval/review/block distributions.
5. **Fintech Design Consistency**: Enforce clean typography (Inter/system font), slate/zinc dark charcoal text, emerald/amber/rose risk palettes, and subtle transitions without flashy neon distractions.

---

## 4. Components to Modify / Polish

1. `frontend/src/app/core/models/risk.models.ts`: Add `MetricsSummary` and `request_id`/`latency_ms` properties.
2. `frontend/src/app/core/services/health.service.ts`: Add `getMetricsSummary()` method.
3. `frontend/src/app/features/dashboard/dashboard.component.ts`: Enhance layout, add live session KPI counter from `MetricsSummary`, ensure proper disclosure labels.
4. `frontend/src/app/features/monitoring/monitoring.component.ts`: Integrate live `GET /metrics/summary` and `GET /health` with automatic refresh.
5. `frontend/src/app/features/risk-analyzer/risk-analyzer.component.ts`: Polish layout, ensure structured reason codes display observed values vs thresholds.
6. `frontend/src/app/layout/header/header.component.ts` & `sidebar.component.ts`: Enhance navigation clarity and live status indicator.
