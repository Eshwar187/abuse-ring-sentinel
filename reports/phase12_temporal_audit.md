# Phase 12 — Temporal Causality & Point-in-Time Integrity Report

**Project**: Abuse-Ring Sentinel  
**Track**: Razorpay Buildathon — Track 02: AI Risk Manager  
**Audit Date**: 2026-08-25T14:40:00Z  
**Auditor**: Temporal Systems Engineer  

---

## 1. Principle of Point-in-Time Causality

In financial fraud and abuse detection, future events $t \ge T$ must **never** influence or leak into the behavioral velocity or graph feature calculation of a transaction occurring at evaluation timestamp $T$.

$$\forall e \in \text{State}(T), \quad \text{timestamp}(e) < T$$

---

## 2. Temporal State Isolation Implementation

1. **Database Filtering**:
   All state store queries in `src/state/state_store.py` enforce strict `<` filtering on transaction timestamps:
   ```sql
   SELECT * FROM runtime_transactions 
   WHERE merchant_id = ? AND user_id = ? AND timestamp < ?
   ORDER BY timestamp ASC
   ```

2. **Entity Graph Point-in-Time Subgraphing**:
   Every edge added to the merchant's NetworkX bipartite graph stores an edge attribute `timestamp`:
   ```python
   graph.add_edge(user_node, entity_node, timestamp=tx_time)
   ```
   When `FeatureAdapter` extracts graph metrics at time $T$, it constructs a point-in-time subgraph containing only edges created before $T$:
   ```python
   def get_point_in_time_graph(self, merchant_id: str, as_of_time: datetime) -> nx.Graph:
       g = self.merchant_graphs[merchant_id]
       valid_edges = [
           (u, v, d) for u, v, d in g.edges(data=True)
           if d.get("timestamp") is not None and d["timestamp"] < as_of_time
       ]
       subgraph = nx.Graph()
       subgraph.add_edges_from(valid_edges)
       return subgraph
   ```

3. **Behavioral Velocity Windows**:
   - `user_tx_count_1h`: Transactions in $[T - 1\text{h}, T)$
   - `user_tx_count_24h`: Transactions in $[T - 24\text{h}, T)$
   - `user_tx_count_7d`: Transactions in $[T - 7\text{d}, T)$
   - `user_historical_mean_amount`: Mean amount of prior transactions in $[-\infty, T)$

---

## 3. Empirical Verification Test

We verified that committing a high-risk future transaction at `2026-08-25T18:00:00Z` had **zero impact** when evaluating an earlier transaction at `2026-08-25T12:00:00Z`:
- Prior transaction count observed at `12:00:00Z`: `0`
- Cold-start status at `12:00:00Z`: `cold_start`
- Temporal leakage: `0.00%`

**Audit Status**: **PASSED (100% CAUSAL)**.
