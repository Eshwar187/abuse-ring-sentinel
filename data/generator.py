"""
Synthetic E-Commerce Transaction and Abuse Ring Generator.

Generates reproducible, deterministic transaction histories containing:
1. Benign isolated shoppers
2. Benign shared-entity clusters (households, shared corporate networks)
3. Coordinated abuse rings (Star, Bipartite Mesh, Chained Sybil topologies)

Ground-truth metadata is strictly separated from observable merchant features.
"""

from __future__ import annotations
import os
import json
import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Tuple, Any, Optional

import numpy as np
import pandas as pd

from data.schemas import (
    GeneratorConfig,
    UserSchema,
    TransactionSchema,
    DatasetMetadata,
    UserPopulationType,
    RingTopologyType,
    OrderStatus,
    ProductCategory,
)


class SyntheticEcommerceGenerator:
    """
    Deterministic synthetic generator for multi-account abuse ring benchmarking.
    """

    def __init__(self, config: Optional[GeneratorConfig] = None):
        self.config = config or GeneratorConfig()
        self.rng = np.random.default_rng(self.config.seed)
        random.seed(self.config.seed)
        
        self.start_datetime = datetime.strptime(self.config.start_date, "%Y-%m-%d %H:%M:%S")
        self.end_datetime = self.start_datetime + timedelta(days=self.config.history_days)
        
        # Entity ID counters
        self._dev_counter = 0
        self._ip_counter = 0
        self._pmt_counter = 0
        self._addr_counter = 0
        self._user_counter = 0
        self._tx_counter = 0

        # Generated storage
        self.users: List[Dict[str, Any]] = []
        self.transactions: List[Dict[str, Any]] = []
        self.ring_metadata: Dict[str, Any] = {}
        self.benign_group_metadata: Dict[str, Any] = {}

    # -------------------------------------------------------------------------
    # Entity ID Helper Methods
    # -------------------------------------------------------------------------
    def _next_user_id(self) -> str:
        self._user_counter += 1
        return f"usr_{self._user_counter:05d}"

    def _next_device_id(self) -> str:
        self._dev_counter += 1
        return f"dev_{self._dev_counter:06d}"

    def _next_ip_address(self) -> str:
        self._ip_counter += 1
        # Generate a realistic-looking IP string
        octet1 = 100 + (self._ip_counter // (256 * 256)) % 100
        octet2 = (self._ip_counter // 256) % 256
        octet3 = self._ip_counter % 256
        octet4 = 1 + (self._ip_counter % 250)
        return f"{octet1}.{octet2}.{octet3}.{octet4}"

    def _next_payment_id(self) -> str:
        self._pmt_counter += 1
        return f"pmt_{self._pmt_counter:06d}"

    def _next_address_id(self) -> str:
        self._addr_counter += 1
        return f"addr_{self._addr_counter:06d}"

    def _next_tx_id(self) -> str:
        self._tx_counter += 1
        return f"tx_{self._tx_counter:07d}"

    def _random_timestamp_within(self, start: datetime, end: datetime) -> datetime:
        """Sample a uniform random timestamp between start and end."""
        delta_sec = int((end - start).total_seconds())
        if delta_sec <= 0:
            return start
        random_sec = int(self.rng.integers(0, delta_sec))
        return start + timedelta(seconds=random_sec)

    def _apply_diurnal_hour(self, dt: datetime, is_bot: bool = False) -> datetime:
        """
        Adjust time to realistic human diurnal pattern (peak evening, low 03:00-06:00),
        or uniform 24/7 if automated bot ring.
        """
        if is_bot:
            return dt
        # Human probability distribution over 24 hours (higher 10-22, lower 01-07)
        hour_weights = [
            0.01, 0.01, 0.005, 0.005, 0.005, 0.01, 0.02, 0.03,  # 00-07
            0.04, 0.05, 0.06, 0.06, 0.07, 0.06, 0.06, 0.06,    # 08-15
            0.07, 0.08, 0.09, 0.08, 0.06, 0.05, 0.04, 0.02     # 16-23
        ]
        hour_weights = np.array(hour_weights) / sum(hour_weights)
        new_hour = int(self.rng.choice(24, p=hour_weights))
        minute = int(self.rng.integers(0, 60))
        second = int(self.rng.integers(0, 60))
        return dt.replace(hour=new_hour, minute=minute, second=second)

    # -------------------------------------------------------------------------
    # 1. Benign Isolated Users Generation
    # -------------------------------------------------------------------------
    def _generate_benign_isolated_users(self, count: int):
        """Generates legitimate, non-colluding individual shoppers."""
        domains = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "proton.me"]
        domain_weights = [0.55, 0.20, 0.15, 0.07, 0.03]

        for _ in range(count):
            user_id = self._next_user_id()
            signup_time = self._random_timestamp_within(
                self.start_datetime - timedelta(days=180),
                self.end_datetime - timedelta(days=5)
            )
            email_domain = str(self.rng.choice(domains, p=domain_weights))
            
            user_record = {
                "user_id": user_id,
                "signup_timestamp": signup_time.strftime("%Y-%m-%d %H:%M:%S"),
                "email_domain": email_domain,
                "user_population_type": UserPopulationType.BENIGN_ISOLATED.value,
                "is_abuse_ring": 0,
                "ring_id": None,
                "ring_type": RingTopologyType.NONE.value,
            }
            self.users.append(user_record)

            # Assign personal entities
            primary_device = self._next_device_id()
            secondary_device = self._next_device_id() if self.rng.random() < 0.10 else primary_device
            primary_ip = self._next_ip_address()
            secondary_ip = self._next_ip_address() if self.rng.random() < 0.25 else primary_ip
            primary_pmt = self._next_payment_id()
            secondary_pmt = self._next_payment_id() if self.rng.random() < 0.15 else primary_pmt
            shipping_addr = self._next_address_id()
            billing_addr = shipping_addr if self.rng.random() < 0.92 else self._next_address_id()

            # Number of transactions across the 90 days (Poisson mean ~ 6)
            num_txs = max(1, int(self.rng.poisson(lam=6)))
            
            # Start generating transactions after user signup
            tx_start = max(self.start_datetime, signup_time + timedelta(hours=1))
            if tx_start >= self.end_datetime:
                continue

            for _ in range(num_txs):
                tx_time = self._random_timestamp_within(tx_start, self.end_datetime)
                tx_time = self._apply_diurnal_hour(tx_time, is_bot=False)

                # Amount: Log-normal distribution (median ~$35, mean ~$55)
                raw_amt = float(self.rng.lognormal(mean=3.7, sigma=0.65))
                amount = round(min(max(raw_amt, 5.0), 1500.0), 2)

                category = str(self.rng.choice(
                    [ProductCategory.APPAREL.value, ProductCategory.GROCERIES.value,
                     ProductCategory.ELECTRONICS.value, ProductCategory.DIGITAL_GOODS.value,
                     ProductCategory.GIFT_CARDS.value],
                    p=[0.35, 0.30, 0.20, 0.12, 0.03]
                ))

                is_promo = 1 if self.rng.random() < 0.18 else 0
                
                # Organic chargeback rate is very low (< 0.2%)
                cb_rand = self.rng.random()
                if cb_rand < 0.002:
                    order_status = OrderStatus.CHARGED_BACK.value
                elif cb_rand < 0.025:
                    order_status = OrderStatus.REFUNDED.value
                else:
                    order_status = OrderStatus.COMPLETED.value

                tx_record = {
                    "transaction_id": self._next_tx_id(),
                    "timestamp": tx_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "user_id": user_id,
                    "amount": amount,
                    "currency": "INR",
                    "device_id": primary_device if self.rng.random() < 0.85 else secondary_device,
                    "ip_address": primary_ip if self.rng.random() < 0.80 else secondary_ip,
                    "payment_instrument_id": primary_pmt if self.rng.random() < 0.85 else secondary_pmt,
                    "shipping_address_id": shipping_addr,
                    "billing_address_id": billing_addr,
                    "product_category": category,
                    "is_promo_used": is_promo,
                    "order_status": order_status,
                    "is_abuse_ring": 0,
                    "ring_id": None,
                    "ring_type": RingTopologyType.NONE.value,
                    "user_population_type": UserPopulationType.BENIGN_ISOLATED.value,
                }
                self.transactions.append(tx_record)

    # -------------------------------------------------------------------------
    # 2. Benign Shared-Entity Groups (Households & Office Subnets)
    # -------------------------------------------------------------------------
    def _generate_benign_shared_groups(self, target_user_count: int):
        """
        Generates legitimate multi-user clusters sharing infrastructure (households, shared IPs).
        Crucial for preventing naive models from flagging any shared device/IP as an attack ring.
        """
        generated_users = 0
        group_idx = 0

        while generated_users < target_user_count:
            group_idx += 1
            group_type = "HOUSEHOLD" if self.rng.random() < 0.65 else "SHARED_IP_OFFICE"
            
            if group_type == "HOUSEHOLD":
                group_size = int(self.rng.integers(2, 5))  # 2 to 4 household members
                group_id = f"benign_hh_{group_idx:04d}"
                shared_address = self._next_address_id()
                shared_home_ip = self._next_ip_address()
                shared_card = self._next_payment_id() if self.rng.random() < 0.50 else None
                shared_tablet = self._next_device_id() if self.rng.random() < 0.30 else None

                for _ in range(group_size):
                    user_id = self._next_user_id()
                    signup_time = self._random_timestamp_within(
                        self.start_datetime - timedelta(days=120),
                        self.end_datetime - timedelta(days=10)
                    )
                    user_record = {
                        "user_id": user_id,
                        "signup_timestamp": signup_time.strftime("%Y-%m-%d %H:%M:%S"),
                        "email_domain": "gmail.com",
                        "user_population_type": UserPopulationType.BENIGN_SHARED.value,
                        "is_abuse_ring": 0,
                        "ring_id": None,  # Not an abuse ring
                        "ring_type": RingTopologyType.HOUSEHOLD.value,
                    }
                    self.users.append(user_record)
                    generated_users += 1

                    user_phone = self._next_device_id()
                    user_card = shared_card if (shared_card and self.rng.random() < 0.70) else self._next_payment_id()
                    
                    # Generate normal transactions
                    num_txs = max(2, int(self.rng.poisson(lam=5)))
                    tx_start = max(self.start_datetime, signup_time + timedelta(hours=1))

                    for _ in range(num_txs):
                        tx_time = self._random_timestamp_within(tx_start, self.end_datetime)
                        tx_time = self._apply_diurnal_hour(tx_time, is_bot=False)

                        raw_amt = float(self.rng.lognormal(mean=3.8, sigma=0.60))
                        amount = round(min(max(raw_amt, 8.0), 1200.0), 2)

                        category = str(self.rng.choice(
                            [ProductCategory.GROCERIES.value, ProductCategory.APPAREL.value,
                             ProductCategory.ELECTRONICS.value],
                            p=[0.50, 0.35, 0.15]
                        ))

                        tx_record = {
                            "transaction_id": self._next_tx_id(),
                            "timestamp": tx_time.strftime("%Y-%m-%d %H:%M:%S"),
                            "user_id": user_id,
                            "amount": amount,
                            "currency": "INR",
                            "device_id": shared_tablet if (shared_tablet and self.rng.random() < 0.25) else user_phone,
                            "ip_address": shared_home_ip if self.rng.random() < 0.75 else self._next_ip_address(),
                            "payment_instrument_id": user_card,
                            "shipping_address_id": shared_address,
                            "billing_address_id": shared_address,
                            "product_category": category,
                            "is_promo_used": 1 if self.rng.random() < 0.20 else 0,
                            "order_status": OrderStatus.COMPLETED.value if self.rng.random() > 0.02 else OrderStatus.REFUNDED.value,
                            "is_abuse_ring": 0,
                            "ring_id": None,
                            "ring_type": RingTopologyType.HOUSEHOLD.value,
                            "user_population_type": UserPopulationType.BENIGN_SHARED.value,
                        }
                        self.transactions.append(tx_record)

            else:
                # SHARED_IP_OFFICE: Colleagues sharing 1 corporate egress IP
                group_size = int(self.rng.integers(3, 8))  # 3 to 7 colleagues
                group_id = f"benign_office_{group_idx:04d}"
                shared_office_ip = self._next_ip_address()

                for _ in range(group_size):
                    user_id = self._next_user_id()
                    signup_time = self._random_timestamp_within(
                        self.start_datetime - timedelta(days=90),
                        self.end_datetime - timedelta(days=10)
                    )
                    user_record = {
                        "user_id": user_id,
                        "signup_timestamp": signup_time.strftime("%Y-%m-%d %H:%M:%S"),
                        "email_domain": "corp.com" if self.rng.random() < 0.4 else "gmail.com",
                        "user_population_type": UserPopulationType.BENIGN_SHARED.value,
                        "is_abuse_ring": 0,
                        "ring_id": None,
                        "ring_type": RingTopologyType.SHARED_IP_OFFICE.value,
                    }
                    self.users.append(user_record)
                    generated_users += 1

                    user_device = self._next_device_id()
                    user_card = self._next_payment_id()
                    user_address = self._next_address_id()

                    num_txs = max(1, int(self.rng.poisson(lam=4)))
                    tx_start = max(self.start_datetime, signup_time + timedelta(hours=1))

                    for _ in range(num_txs):
                        tx_time = self._random_timestamp_within(tx_start, self.end_datetime)
                        tx_time = self._apply_diurnal_hour(tx_time, is_bot=False)

                        raw_amt = float(self.rng.lognormal(mean=3.5, sigma=0.5))
                        amount = round(min(max(raw_amt, 5.0), 800.0), 2)

                        tx_record = {
                            "transaction_id": self._next_tx_id(),
                            "timestamp": tx_time.strftime("%Y-%m-%d %H:%M:%S"),
                            "user_id": user_id,
                            "amount": amount,
                            "currency": "INR",
                            "device_id": user_device,
                            "ip_address": shared_office_ip,  # All share office IP
                            "payment_instrument_id": user_card,
                            "shipping_address_id": user_address,
                            "billing_address_id": user_address,
                            "product_category": str(self.rng.choice([ProductCategory.GROCERIES.value, ProductCategory.DIGITAL_GOODS.value])),
                            "is_promo_used": 1 if self.rng.random() < 0.15 else 0,
                            "order_status": OrderStatus.COMPLETED.value,
                            "is_abuse_ring": 0,
                            "ring_id": None,
                            "ring_type": RingTopologyType.SHARED_IP_OFFICE.value,
                            "user_population_type": UserPopulationType.BENIGN_SHARED.value,
                        }
                        self.transactions.append(tx_record)

    # -------------------------------------------------------------------------
    # 3. Coordinated Abuse Rings Generation
    # -------------------------------------------------------------------------
    def _generate_abuse_rings(self, target_user_count: int):
        """
        Generates coordinated multi-account abuse syndicates with specific graph topologies.
        """
        generated_users = 0
        ring_idx = 0

        while generated_users < target_user_count:
            ring_idx += 1
            topology_choice = str(self.rng.choice(
                [RingTopologyType.STAR.value, RingTopologyType.BIPARTITE_MESH.value, RingTopologyType.CHAINED_SYBIL.value],
                p=[self.config.star_ring_ratio, self.config.mesh_ring_ratio, self.config.chained_ring_ratio]
            ))

            if topology_choice == RingTopologyType.STAR.value:
                # STAR TOPOLOGY: 6-15 accounts radiating from 1 central stolen card or device
                ring_size = int(self.rng.integers(6, 16))
                ring_id = f"ring_star_{ring_idx:03d}"
                self._build_star_ring(ring_id, ring_size)
                generated_users += ring_size

            elif topology_choice == RingTopologyType.BIPARTITE_MESH.value:
                # BIPARTITE MESH: 6-12 accounts rotating across 2-4 shared devices & 3-5 IPs
                ring_size = int(self.rng.integers(6, 13))
                ring_id = f"ring_mesh_{ring_idx:03d}"
                self._build_mesh_ring(ring_id, ring_size)
                generated_users += ring_size

            else:
                # CHAINED SYBIL: 5-10 accounts linked pairwise in a sequential chain
                ring_size = int(self.rng.integers(5, 11))
                ring_id = f"ring_sybil_{ring_idx:03d}"
                self._build_chained_ring(ring_id, ring_size)
                generated_users += ring_size

    def _build_star_ring(self, ring_id: str, ring_size: int):
        """Constructs a Star topology ring anchored around a single device or payment token."""
        # Attack window: Synchronous burst within 2 to 36 hours
        window_duration_hours = int(self.rng.integers(2, 36))
        ring_start = self._random_timestamp_within(
            self.start_datetime + timedelta(days=5),
            self.end_datetime - timedelta(days=15)
        )
        ring_end = ring_start + timedelta(hours=window_duration_hours)

        # Central star hub entity
        is_payment_hub = self.rng.random() < 0.50
        hub_payment = self._next_payment_id() if is_payment_hub else None
        hub_device = self._next_device_id() if not is_payment_hub else None
        drop_address = self._next_address_id() if self.rng.random() < 0.40 else None

        for i in range(ring_size):
            user_id = self._next_user_id()
            signup_time = ring_start - timedelta(minutes=int(self.rng.integers(5, 120)))
            
            user_record = {
                "user_id": user_id,
                "signup_timestamp": signup_time.strftime("%Y-%m-%d %H:%M:%S"),
                "email_domain": str(self.rng.choice(["tempmail.org", "trashmail.com", "proton.me", "10minutemail.net"])),
                "user_population_type": UserPopulationType.ABUSE_RING.value,
                "is_abuse_ring": 1,
                "ring_id": ring_id,
                "ring_type": RingTopologyType.STAR.value,
            }
            self.users.append(user_record)

            # Number of rapid orders per bot account (1 to 4)
            num_txs = int(self.rng.integers(1, 5))
            for _ in range(num_txs):
                tx_time = self._random_timestamp_within(ring_start, ring_end)
                
                # Stolen card or promo arbitrage amounts (skewed higher or voucher thresholds)
                amount = round(float(self.rng.choice([99.99, 149.50, 199.00, 249.99, 499.00, 49.00])), 2)
                
                # Stolen card chargeback probability (50% chargeback)
                is_cb = self.rng.random() < 0.55
                order_status = OrderStatus.CHARGED_BACK.value if is_cb else OrderStatus.COMPLETED.value

                tx_record = {
                    "transaction_id": self._next_tx_id(),
                    "timestamp": tx_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "user_id": user_id,
                    "amount": amount,
                    "currency": "INR",
                    "device_id": hub_device if hub_device else self._next_device_id(),
                    "ip_address": self._next_ip_address(),  # Rotating proxies
                    "payment_instrument_id": hub_payment if hub_payment else self._next_payment_id(),
                    "shipping_address_id": drop_address if drop_address else self._next_address_id(),
                    "billing_address_id": self._next_address_id(),
                    "product_category": str(self.rng.choice([ProductCategory.GIFT_CARDS.value, ProductCategory.ELECTRONICS.value, ProductCategory.DIGITAL_GOODS.value])),
                    "is_promo_used": 1 if self.rng.random() < 0.75 else 0,
                    "order_status": order_status,
                    "is_abuse_ring": 1,
                    "ring_id": ring_id,
                    "ring_type": RingTopologyType.STAR.value,
                    "user_population_type": UserPopulationType.ABUSE_RING.value,
                }
                self.transactions.append(tx_record)

    def _build_mesh_ring(self, ring_id: str, ring_size: int):
        """Constructs a Bipartite Mesh ring rotating across small pools of devices and IPs."""
        window_duration_hours = int(self.rng.integers(6, 72))
        ring_start = self._random_timestamp_within(
            self.start_datetime + timedelta(days=5),
            self.end_datetime - timedelta(days=15)
        )
        ring_end = ring_start + timedelta(hours=window_duration_hours)

        # Shared pools
        num_devices = max(2, ring_size // 3)
        num_ips = max(2, ring_size // 2)
        num_cards = max(2, ring_size // 2)
        
        device_pool = [self._next_device_id() for _ in range(num_devices)]
        ip_pool = [self._next_ip_address() for _ in range(num_ips)]
        card_pool = [self._next_payment_id() for _ in range(num_cards)]
        drop_address = self._next_address_id()

        for _ in range(ring_size):
            user_id = self._next_user_id()
            signup_time = ring_start - timedelta(minutes=int(self.rng.integers(10, 300)))

            user_record = {
                "user_id": user_id,
                "signup_timestamp": signup_time.strftime("%Y-%m-%d %H:%M:%S"),
                "email_domain": str(self.rng.choice(["gmail.com", "tempmail.org", "mailinator.com"])),
                "user_population_type": UserPopulationType.ABUSE_RING.value,
                "is_abuse_ring": 1,
                "ring_id": ring_id,
                "ring_type": RingTopologyType.BIPARTITE_MESH.value,
            }
            self.users.append(user_record)

            num_txs = int(self.rng.integers(2, 6))
            for _ in range(num_txs):
                tx_time = self._random_timestamp_within(ring_start, ring_end)
                amount = round(float(self.rng.uniform(40.0, 350.0)), 2)
                
                is_cb = self.rng.random() < 0.45
                order_status = OrderStatus.CHARGED_BACK.value if is_cb else OrderStatus.COMPLETED.value

                tx_record = {
                    "transaction_id": self._next_tx_id(),
                    "timestamp": tx_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "user_id": user_id,
                    "amount": amount,
                    "currency": "INR",
                    "device_id": str(self.rng.choice(device_pool)),
                    "ip_address": str(self.rng.choice(ip_pool)),
                    "payment_instrument_id": str(self.rng.choice(card_pool)),
                    "shipping_address_id": drop_address if self.rng.random() < 0.60 else self._next_address_id(),
                    "billing_address_id": self._next_address_id(),
                    "product_category": str(self.rng.choice([ProductCategory.ELECTRONICS.value, ProductCategory.GIFT_CARDS.value])),
                    "is_promo_used": 1 if self.rng.random() < 0.65 else 0,
                    "order_status": order_status,
                    "is_abuse_ring": 1,
                    "ring_id": ring_id,
                    "ring_type": RingTopologyType.BIPARTITE_MESH.value,
                    "user_population_type": UserPopulationType.ABUSE_RING.value,
                }
                self.transactions.append(tx_record)

    def _build_chained_ring(self, ring_id: str, ring_size: int):
        """Constructs a Chained Sybil ring where adjacent accounts share exactly 1 bridge entity."""
        ring_start = self._random_timestamp_within(
            self.start_datetime + timedelta(days=5),
            self.end_datetime - timedelta(days=20)
        )
        ring_end = ring_start + timedelta(days=7)  # Slower rolling chain attack

        # Create chain bridge entities
        # User 0 and 1 share entity 0, User 1 and 2 share entity 1, etc.
        bridge_entities = []
        for i in range(ring_size - 1):
            entity_type = i % 4
            if entity_type == 0:
                bridge_entities.append(("ip", self._next_ip_address()))
            elif entity_type == 1:
                bridge_entities.append(("card", self._next_payment_id()))
            elif entity_type == 2:
                bridge_entities.append(("device", self._next_device_id()))
            else:
                bridge_entities.append(("address", self._next_address_id()))

        user_ids = []
        for i in range(ring_size):
            user_id = self._next_user_id()
            user_ids.append(user_id)
            signup_time = ring_start + timedelta(hours=i * 6)

            user_record = {
                "user_id": user_id,
                "signup_timestamp": signup_time.strftime("%Y-%m-%d %H:%M:%S"),
                "email_domain": "outlook.com" if i % 2 == 0 else "gmail.com",
                "user_population_type": UserPopulationType.ABUSE_RING.value,
                "is_abuse_ring": 1,
                "ring_id": ring_id,
                "ring_type": RingTopologyType.CHAINED_SYBIL.value,
            }
            self.users.append(user_record)

            # Assign entities (linking to left bridge and right bridge)
            u_dev = self._next_device_id()
            u_ip = self._next_ip_address()
            u_pmt = self._next_payment_id()
            u_addr = self._next_address_id()

            # Left bridge (from i-1)
            if i > 0:
                b_type, b_val = bridge_entities[i - 1]
                if b_type == "ip": u_ip = b_val
                elif b_type == "card": u_pmt = b_val
                elif b_type == "device": u_dev = b_val
                elif b_type == "address": u_addr = b_val

            # Right bridge (to i)
            if i < ring_size - 1:
                b_type, b_val = bridge_entities[i]
                if b_type == "ip": u_ip = b_val
                elif b_type == "card": u_pmt = b_val
                elif b_type == "device": u_dev = b_val
                elif b_type == "address": u_addr = b_val

            # Generate transactions
            num_txs = int(self.rng.integers(1, 4))
            for _ in range(num_txs):
                tx_time = self._random_timestamp_within(signup_time, signup_time + timedelta(hours=18))
                amount = round(float(self.rng.uniform(25.0, 220.0)), 2)
                is_cb = self.rng.random() < 0.40

                tx_record = {
                    "transaction_id": self._next_tx_id(),
                    "timestamp": tx_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "user_id": user_id,
                    "amount": amount,
                    "currency": "INR",
                    "device_id": u_dev,
                    "ip_address": u_ip,
                    "payment_instrument_id": u_pmt,
                    "shipping_address_id": u_addr,
                    "billing_address_id": u_addr,
                    "product_category": str(self.rng.choice([ProductCategory.APPAREL.value, ProductCategory.ELECTRONICS.value])),
                    "is_promo_used": 1 if self.rng.random() < 0.55 else 0,
                    "order_status": OrderStatus.CHARGED_BACK.value if is_cb else OrderStatus.COMPLETED.value,
                    "is_abuse_ring": 1,
                    "ring_id": ring_id,
                    "ring_type": RingTopologyType.CHAINED_SYBIL.value,
                    "user_population_type": UserPopulationType.ABUSE_RING.value,
                }
                self.transactions.append(tx_record)

    # -------------------------------------------------------------------------
    # Main Orchestrator & Exporter
    # -------------------------------------------------------------------------
    def generate(self) -> Tuple[pd.DataFrame, pd.DataFrame, DatasetMetadata]:
        """
        Executes deterministic generation of full benchmark dataset.
        Returns:
            users_df: DataFrame of user metadata
            transactions_df: DataFrame of all transactions sorted chronologically
            metadata: DatasetMetadata object summarizing generation
        """
        num_users = self.config.num_users
        benign_isolated_count = int(num_users * self.config.benign_isolated_ratio)
        benign_shared_count = int(num_users * self.config.benign_shared_ratio)
        abuse_ring_count = num_users - (benign_isolated_count + benign_shared_count)

        # 1. Generate Populations
        self._generate_benign_isolated_users(benign_isolated_count)
        self._generate_benign_shared_groups(benign_shared_count)
        self._generate_abuse_rings(abuse_ring_count)

        # 2. Convert to DataFrames and sort
        users_df = pd.DataFrame(self.users)
        transactions_df = pd.DataFrame(self.transactions)
        
        # Sort transactions chronologically
        transactions_df["timestamp_dt"] = pd.to_datetime(transactions_df["timestamp"])
        transactions_df = transactions_df.sort_values(by="timestamp_dt").reset_index(drop=True)
        transactions_df = transactions_df.drop(columns=["timestamp_dt"])

        # Compute summary metadata
        ring_counts = users_df[users_df["is_abuse_ring"] == 1]["ring_type"].value_counts().to_dict()
        num_unique_rings = users_df[users_df["is_abuse_ring"] == 1]["ring_id"].nunique()
        num_benign_groups = users_df[users_df["user_population_type"] == UserPopulationType.BENIGN_SHARED.value]["ring_type"].value_counts().to_dict()

        metadata = DatasetMetadata(
            seed=self.config.seed,
            generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            total_users=len(users_df),
            total_transactions=len(transactions_df),
            benign_isolated_users=int((users_df["user_population_type"] == UserPopulationType.BENIGN_ISOLATED.value).sum()),
            benign_shared_users=int((users_df["user_population_type"] == UserPopulationType.BENIGN_SHARED.value).sum()),
            abuse_ring_users=int((users_df["user_population_type"] == UserPopulationType.ABUSE_RING.value).sum()),
            num_abuse_rings=num_unique_rings,
            num_benign_groups=int(sum(num_benign_groups.values())),
            abuse_ring_transaction_count=int((transactions_df["is_abuse_ring"] == 1).sum()),
            benign_transaction_count=int((transactions_df["is_abuse_ring"] == 0).sum()),
            ring_topology_breakdown={str(k): int(v) for k, v in ring_counts.items()},
            date_range_start=str(transactions_df["timestamp"].min()),
            date_range_end=str(transactions_df["timestamp"].max()),
        )

        return users_df, transactions_df, metadata

    def save(self, output_dir: Optional[str] = None) -> Dict[str, str]:
        """Generates and writes CSV and Parquet files into target directory."""
        target_dir = output_dir or self.config.output_dir
        os.makedirs(target_dir, exist_ok=True)

        users_df, transactions_df, metadata = self.generate()

        users_csv_path = os.path.join(target_dir, "users.csv")
        tx_csv_path = os.path.join(target_dir, "transactions.csv")
        metadata_path = os.path.join(target_dir, "metadata.json")

        users_df.to_csv(users_csv_path, index=False)
        transactions_df.to_csv(tx_csv_path, index=False)

        # Also save parquet for fast reading if engine available
        try:
            users_df.to_parquet(os.path.join(target_dir, "users.parquet"), index=False)
            transactions_df.to_parquet(os.path.join(target_dir, "transactions.parquet"), index=False)
        except Exception:
            pass

        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata.model_dump(), f, indent=2)

        return {
            "users_csv": users_csv_path,
            "transactions_csv": tx_csv_path,
            "metadata_json": metadata_path,
        }
