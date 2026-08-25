"""
Entity Repository for MySQL persistence.
Manages heterogeneous entity relationships (Device, IP, Payment, Shipping, Billing)
and point-in-time graph feature extraction.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Set, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, desc
import networkx as nx

from src.db.models import TransactionEntityModel, EntityRelationshipModel


class EntityRepository:
    def __init__(self, session: Session):
        self.session = session

    def record_entities(
        self,
        merchant_id: str,
        transaction_id: str,
        user_id: str,
        entities: Dict[str, Optional[str]],
        timestamp: datetime,
    ) -> None:
        """
        Persists entity mappings for a transaction and updates entity_relationships in MySQL.
        """
        now = datetime.utcnow()
        for entity_type, entity_id in entities.items():
            if not entity_id:
                continue

            # 1. Record transaction-entity mapping
            tx_ent = TransactionEntityModel(
                merchant_id=merchant_id,
                transaction_id=transaction_id,
                entity_type=entity_type,
                entity_id=str(entity_id),
                created_at=now,
            )
            self.session.add(tx_ent)

            # 2. Upsert entity_relationships in MySQL
            stmt = select(EntityRelationshipModel).where(
                EntityRelationshipModel.merchant_id == merchant_id,
                EntityRelationshipModel.entity_type == entity_type,
                EntityRelationshipModel.entity_id == str(entity_id),
                EntityRelationshipModel.user_id == user_id,
            )
            rel = self.session.scalar(stmt)
            if not rel:
                rel = EntityRelationshipModel(
                    merchant_id=merchant_id,
                    entity_type=entity_type,
                    entity_id=str(entity_id),
                    user_id=user_id,
                    first_seen_at=timestamp,
                    last_seen_at=timestamp,
                    shared_count=1,
                    created_at=now,
                    updated_at=now,
                )
                self.session.add(rel)
            else:
                if timestamp < rel.first_seen_at:
                    rel.first_seen_at = timestamp
                if timestamp > rel.last_seen_at:
                    rel.last_seen_at = timestamp
                rel.shared_count += 1
                rel.updated_at = now

    def get_prior_entity_users(
        self,
        merchant_id: str,
        entity_type: str,
        entity_id: str,
        before_timestamp: datetime,
    ) -> Set[str]:
        """
        Point-in-Time: Returns distinct users that shared an entity strictly before timestamp T.
        """
        stmt = select(EntityRelationshipModel.user_id).where(
            EntityRelationshipModel.merchant_id == merchant_id,
            EntityRelationshipModel.entity_type == entity_type,
            EntityRelationshipModel.entity_id == entity_id,
            EntityRelationshipModel.first_seen_at < before_timestamp,
        )
        return set(self.session.scalars(stmt).all())

    def get_point_in_time_graph_features(
        self,
        merchant_id: str,
        user_id: str,
        entities: Dict[str, Optional[str]],
        before_timestamp: datetime,
    ) -> Dict[str, Any]:
        """
        Computes the 12 heterogeneous graph collusion features strictly before timestamp T from MySQL.
        """
        device_users = self.get_prior_entity_users(merchant_id, "device_id", entities.get("device_id", ""), before_timestamp) if entities.get("device_id") else set()
        ip_users = self.get_prior_entity_users(merchant_id, "ip_address", entities.get("ip_address", ""), before_timestamp) if entities.get("ip_address") else set()
        payment_users = self.get_prior_entity_users(merchant_id, "payment_method_id", entities.get("payment_method_id", ""), before_timestamp) if entities.get("payment_method_id") else set()
        shipping_users = self.get_prior_entity_users(merchant_id, "shipping_address_id", entities.get("shipping_address_id", ""), before_timestamp) if entities.get("shipping_address_id") else set()
        billing_users = self.get_prior_entity_users(merchant_id, "billing_address_id", entities.get("billing_address_id", ""), before_timestamp) if entities.get("billing_address_id") else set()

        device_prior = max(1, len(device_users)) if entities.get("device_id") else 0
        ip_prior = max(1, len(ip_users)) if entities.get("ip_address") else 0
        payment_prior = max(1, len(payment_users)) if entities.get("payment_method_id") else 0
        shipping_prior = max(1, len(shipping_users)) if entities.get("shipping_address_id") else 0
        billing_prior = max(1, len(billing_users)) if entities.get("billing_address_id") else 0

        # Connected users excluding current user
        all_connected_users = (device_users | ip_users | payment_users | shipping_users | billing_users)
        connected_count = len(all_connected_users)
        if user_id in all_connected_users:
            connected_users_excluding_self = max(1, connected_count)
        else:
            connected_users_excluding_self = max(1, connected_count + 1)

        counts_list = [len(device_users), len(ip_users), len(payment_users), len(shipping_users), len(billing_users)]
        max_shared_count = max(counts_list) if any(counts_list) else 1
        max_shared_count = max(1, max_shared_count)

        shared_types_count = sum(1 for c in [len(device_users), len(ip_users), len(payment_users), len(shipping_users), len(billing_users)] if c > 1)

        # Build local point-in-time subgraph for component metrics
        G = nx.Graph()
        G.add_node(f"u:{user_id}", node_type="user")
        for et, eid in entities.items():
            if eid:
                ent_node = f"{et}:{eid}"
                G.add_node(ent_node, node_type=et)
                G.add_edge(f"u:{user_id}", ent_node)

        for u in all_connected_users:
            if u != user_id:
                G.add_node(f"u:{u}", node_type="user")
                if u in device_users and entities.get("device_id"):
                    G.add_edge(f"u:{u}", f"device_id:{entities['device_id']}")
                if u in ip_users and entities.get("ip_address"):
                    G.add_edge(f"u:{u}", f"ip_address:{entities['ip_address']}")
                if u in payment_users and entities.get("payment_method_id"):
                    G.add_edge(f"u:{u}", f"payment_method_id:{entities['payment_method_id']}")
                if u in shipping_users and entities.get("shipping_address_id"):
                    G.add_edge(f"u:{u}", f"shipping_address_id:{entities['shipping_address_id']}")
                if u in billing_users and entities.get("billing_address_id"):
                    G.add_edge(f"u:{u}", f"billing_address_id:{entities['billing_address_id']}")

        n_nodes = G.number_of_nodes()
        n_edges = G.number_of_edges()
        user_nodes = [n for n, d in G.nodes(data=True) if d.get("node_type") == "user"]
        comp_user_count = max(1, len(user_nodes))
        density = (2.0 * n_edges) / (n_nodes * (n_nodes - 1)) if n_nodes > 1 else 0.0

        return {
            "device_prior_user_count": device_prior,
            "ip_prior_user_count": ip_prior,
            "payment_prior_user_count": payment_prior,
            "shipping_address_prior_user_count": shipping_prior,
            "billing_address_prior_user_count": billing_prior,
            "max_shared_entity_user_count": max_shared_count,
            "number_of_prior_connected_users": connected_users_excluding_self,
            "shared_entity_types_count": shared_types_count,
            "connected_component_user_count": comp_user_count,
            "connected_component_total_nodes": n_nodes,
            "connected_component_edge_count": n_edges,
            "connected_component_density": density,
        }

    def reconstruct_all_relationships(self, merchant_id: str) -> List[EntityRelationshipModel]:
        """
        Loads all entity relationships for a merchant from MySQL to reconstruct graph state on startup.
        """
        stmt = select(EntityRelationshipModel).where(
            EntityRelationshipModel.merchant_id == merchant_id
        ).order_by(EntityRelationshipModel.first_seen_at)
        return list(self.session.scalars(stmt).all())
