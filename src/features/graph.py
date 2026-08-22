"""
Point-in-Time Graph Feature Engine.

Constructs an incremental bipartite entity graph G_<t_pred containing only
edges established by transactions strictly prior to t_pred.

Extracts graph topological signals:
- Prior user counts per entity (devices, IPs, payments, addresses)
- Max entity sharing degree
- Prior connected user neighborhood size (2-hop bipartite projection)
- Connected component size and density in G_<t_pred
"""

from __future__ import annotations
from typing import Dict, Any, Set, Tuple, Optional
import networkx as nx


class PointInTimeGraphEngine:
    """
    Incremental point-in-time graph builder and feature extractor.
    """

    def __init__(self):
        # NetworkX graph containing historical nodes and edges strictly before t_pred
        self.graph: nx.Graph = nx.Graph()

        # Fast inverted index for entity -> set of distinct user_ids
        self.entity_to_users: Dict[Tuple[str, str], Set[str]] = {}
        # User -> set of connected entity tuples
        self.user_to_entities: Dict[str, Set[Tuple[str, str]]] = {}

    def extract_features(self, tx: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates graph features for transaction tx using G_<t_pred.
        CRITICAL: Does NOT insert tx edges into the graph.
        """
        user_id = str(tx["user_id"])
        dev_id = str(tx.get("device_id", ""))
        ip_addr = str(tx.get("ip_address", ""))
        pmt_id = str(tx.get("payment_instrument_id", ""))
        shipping_addr = str(tx.get("shipping_address_id", ""))
        billing_addr = str(tx.get("billing_address_id", ""))

        # 1. Entity-level prior user counts
        dev_key = ("DEVICE", dev_id)
        ip_key = ("IP", ip_addr)
        pmt_key = ("PAYMENT", pmt_id)
        ship_key = ("SHIPPING_ADDR", shipping_addr)
        bill_key = ("BILLING_ADDR", billing_addr)

        dev_users = self.entity_to_users.get(dev_key, set())
        ip_users = self.entity_to_users.get(ip_key, set())
        pmt_users = self.entity_to_users.get(pmt_key, set())
        ship_users = self.entity_to_users.get(ship_key, set())
        bill_users = self.entity_to_users.get(bill_key, set())

        device_prior_user_count = len(dev_users)
        ip_prior_user_count = len(ip_users)
        payment_prior_user_count = len(pmt_users)
        shipping_address_prior_user_count = len(ship_users)
        billing_address_prior_user_count = len(bill_users)

        # Max shared entity degree across current transaction entities
        max_shared_entity_user_count = max(
            device_prior_user_count,
            ip_prior_user_count,
            payment_prior_user_count,
            shipping_address_prior_user_count,
            billing_address_prior_user_count,
        )

        # 2. Number of prior connected users across all entities in current checkout
        all_linked_users = set().union(dev_users, ip_users, pmt_users, ship_users, bill_users)
        # Exclude the current user if they were already linked
        prior_co_users = all_linked_users - {user_id}
        number_of_prior_connected_users = len(prior_co_users)

        # Count of current entities that already have multi-user history (prior degree > 1)
        shared_entity_types_count = sum([
            1 if len(dev_users) > 1 else 0,
            1 if len(ip_users) > 1 else 0,
            1 if len(pmt_users) > 1 else 0,
            1 if len(ship_users) > 1 else 0,
            1 if len(bill_users) > 1 else 0,
        ])

        # 3. Connected Component Analysis in G_<t_pred
        user_node = ("USER", user_id)
        if self.graph.has_node(user_node):
            # Find connected component containing user
            comp_nodes = nx.node_connected_component(self.graph, user_node)
            # Count only user nodes in the component
            comp_user_count = sum(1 for n in comp_nodes if n[0] == "USER")
            total_comp_nodes = len(comp_nodes)
            
            # Compute subgraph density
            if total_comp_nodes > 1:
                sub_g = self.graph.subgraph(comp_nodes)
                comp_density = nx.density(sub_g)
                comp_edge_count = sub_g.number_of_edges()
            else:
                comp_density = 0.0
                comp_edge_count = 0
        else:
            # Cold-start / first-time user in graph
            comp_user_count = 1
            total_comp_nodes = 1
            comp_density = 0.0
            comp_edge_count = 0

        return {
            "device_prior_user_count": device_prior_user_count,
            "ip_prior_user_count": ip_prior_user_count,
            "payment_prior_user_count": payment_prior_user_count,
            "shipping_address_prior_user_count": shipping_address_prior_user_count,
            "billing_address_prior_user_count": billing_address_prior_user_count,
            "max_shared_entity_user_count": max_shared_entity_user_count,
            "number_of_prior_connected_users": number_of_prior_connected_users,
            "shared_entity_types_count": shared_entity_types_count,
            "connected_component_user_count": comp_user_count,
            "connected_component_total_nodes": total_comp_nodes,
            "connected_component_edge_count": comp_edge_count,
            "connected_component_density": round(float(comp_density), 4),
        }

    def commit_transaction(self, tx: Dict[str, Any]):
        """
        Inserts transaction entity relationships into G_<t_pred.
        MUST ONLY be called AFTER extract_features() for transaction tx.
        """
        user_id = str(tx["user_id"])
        user_node = ("USER", user_id)

        entities = [
            ("DEVICE", str(tx.get("device_id", ""))),
            ("IP", str(tx.get("ip_address", ""))),
            ("PAYMENT", str(tx.get("payment_instrument_id", ""))),
            ("SHIPPING_ADDR", str(tx.get("shipping_address_id", ""))),
            ("BILLING_ADDR", str(tx.get("billing_address_id", ""))),
        ]

        if user_id not in self.user_to_entities:
            self.user_to_entities[user_id] = set()

        for entity_key in entities:
            # Skip empty entity values
            if not entity_key[1]:
                continue

            # Update inverted index
            if entity_key not in self.entity_to_users:
                self.entity_to_users[entity_key] = set()
            self.entity_to_users[entity_key].add(user_id)
            self.user_to_entities[user_id].add(entity_key)

            # Update NetworkX graph
            self.graph.add_edge(user_node, entity_key)
