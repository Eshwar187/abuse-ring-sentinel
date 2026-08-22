"""
Dataset Generation CLI Script for Abuse-Ring Sentinel.

Usage:
    py scripts/generate_dataset.py --seed 42 --users 5000 --out-dir data/raw
"""

import sys
import os
import argparse
import json

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tabulate import tabulate
import pandas as pd
from data.schemas import GeneratorConfig, UserPopulationType, RingTopologyType
from data.generator import SyntheticEcommerceGenerator


def parse_args():
    parser = argparse.ArgumentParser(description="Generate synthetic e-commerce transaction dataset for abuse ring benchmarking.")
    parser.add_argument("--seed", type=int, default=42, help="Master random seed (default: 42)")
    parser.add_argument("--users", type=int, default=5000, help="Total number of users to generate (default: 5000)")
    parser.add_argument("--days", type=int, default=90, help="History window duration in days (default: 90)")
    parser.add_argument("--out-dir", type=str, default="data/raw", help="Output directory for generated files")
    return parser.parse_args()


def display_examples(users_df: pd.DataFrame, transactions_df: pd.DataFrame):
    print("\n" + "=" * 80)
    print("REPRESENTATIVE POPULATION EXAMPLES")
    print("=" * 80)

    # 1. Benign Isolated User Example
    benign_user = users_df[users_df["user_population_type"] == UserPopulationType.BENIGN_ISOLATED.value].iloc[0]
    benign_txs = transactions_df[transactions_df["user_id"] == benign_user["user_id"]]
    print("\n[1] BENIGN ISOLATED USER")
    print(f"User ID: {benign_user['user_id']} | Email: *@{benign_user['email_domain']} | Population: {benign_user['user_population_type']}")
    print(f"Total Transactions: {len(benign_txs)}")
    print(tabulate(
        benign_txs[["transaction_id", "timestamp", "amount", "device_id", "ip_address", "payment_instrument_id", "product_category", "order_status"]].head(4),
        headers="keys", tablefmt="grid", showindex=False
    ))

    # 2. Benign Shared Entity Group Example (Household)
    household_users = users_df[users_df["ring_type"] == RingTopologyType.HOUSEHOLD.value]
    if len(household_users) > 0:
        sample_users = household_users.head(3)["user_id"].tolist()
        hh_txs = transactions_df[transactions_df["user_id"].isin(sample_users)]
        print("\n[2] BENIGN SHARED-ENTITY GROUP (Legitimate Family Household)")
        print(f"User IDs: {', '.join(sample_users)} (Sharing Address / Home Wi-Fi IP)")
        print(f"Total Transactions in Cluster: {len(hh_txs)}")
        print(tabulate(
            hh_txs[["transaction_id", "user_id", "timestamp", "amount", "device_id", "ip_address", "shipping_address_id", "order_status"]].head(6),
            headers="keys", tablefmt="grid", showindex=False
        ))

    # 3. Coordinated Abuse Ring Example (Star Topology)
    star_users = users_df[users_df["ring_type"] == RingTopologyType.STAR.value]
    if len(star_users) > 0:
        sample_ring_id = star_users.iloc[0]["ring_id"]
        ring_members = star_users[star_users["ring_id"] == sample_ring_id]["user_id"].tolist()
        ring_txs = transactions_df[transactions_df["user_id"].isin(ring_members)]
        print(f"\n[3] COORDINATED ABUSE RING (Star Topology: Ring ID '{sample_ring_id}')")
        print(f"Ring Accounts ({len(ring_members)} bots): {', '.join(ring_members[:5])}...")
        print(f"Attack Transactions: {len(ring_txs)} orders in burst window")
        print(tabulate(
            ring_txs[["transaction_id", "user_id", "timestamp", "amount", "device_id", "payment_instrument_id", "is_promo_used", "order_status"]].head(6),
            headers="keys", tablefmt="grid", showindex=False
        ))

    # 4. Coordinated Abuse Ring Example (Chained Sybil Topology)
    sybil_users = users_df[users_df["ring_type"] == RingTopologyType.CHAINED_SYBIL.value]
    if len(sybil_users) > 0:
        sample_sybil_id = sybil_users.iloc[0]["ring_id"]
        sybil_members = sybil_users[sybil_users["ring_id"] == sample_sybil_id]["user_id"].tolist()
        sybil_txs = transactions_df[transactions_df["user_id"].isin(sybil_members)]
        print(f"\n[4] COORDINATED ABUSE RING (Chained Sybil Topology: Ring ID '{sample_sybil_id}')")
        print(f"Sequential Chain Accounts ({len(sybil_members)} accounts): {', '.join(sybil_members)}")
        print(tabulate(
            sybil_txs[["transaction_id", "user_id", "timestamp", "amount", "device_id", "ip_address", "payment_instrument_id", "shipping_address_id"]].head(6),
            headers="keys", tablefmt="grid", showindex=False
        ))


def main():
    args = parse_args()

    print("=" * 80)
    print("ABUSE-RING SENTINEL: SYNTHETIC DATASET GENERATION")
    print("=" * 80)
    print(f"Configuring generation with Seed={args.seed}, Target Users={args.users}, Duration={args.days} days")

    config = GeneratorConfig(
        seed=args.seed,
        num_users=args.users,
        history_days=args.days,
        output_dir=args.out_dir,
    )

    generator = SyntheticEcommerceGenerator(config)
    paths = generator.save()

    with open(paths["metadata_json"], "r", encoding="utf-8") as f:
        meta_dict = json.load(f)

    # Display Statistics Table
    print("\n" + "=" * 80)
    print("DATASET GENERATION SUMMARY & STATISTICS")
    print("=" * 80)

    user_stats = [
        ["Total Users", meta_dict["total_users"], "100.0%"],
        ["Benign Isolated Users", meta_dict["benign_isolated_users"], f"{meta_dict['benign_isolated_users'] / meta_dict['total_users'] * 100:.1f}%"],
        ["Benign Shared Users (Households/Office)", meta_dict["benign_shared_users"], f"{meta_dict['benign_shared_users'] / meta_dict['total_users'] * 100:.1f}%"],
        ["Abuse Ring Users", meta_dict["abuse_ring_users"], f"{meta_dict['abuse_ring_users'] / meta_dict['total_users'] * 100:.1f}%"],
        ["Distinct Abuse Rings", meta_dict["num_abuse_rings"], "-"],
    ]
    print(tabulate(user_stats, headers=["User Population Category", "Count", "Share"], tablefmt="grid"))

    tx_stats = [
        ["Total Transactions", meta_dict["total_transactions"], "100.0%"],
        ["Benign Transactions", meta_dict["benign_transaction_count"], f"{meta_dict['benign_transaction_count'] / meta_dict['total_transactions'] * 100:.1f}%"],
        ["Abuse Ring Transactions", meta_dict["abuse_ring_transaction_count"], f"{meta_dict['abuse_ring_transaction_count'] / meta_dict['total_transactions'] * 100:.1f}%"],
        ["Date Range Start", meta_dict["date_range_start"], "-"],
        ["Date Range End", meta_dict["date_range_end"], "-"],
    ]
    print("\n" + tabulate(tx_stats, headers=["Transaction Metric", "Value", "Share"], tablefmt="grid"))

    topology_stats = [[k, v] for k, v in meta_dict["ring_topology_breakdown"].items()]
    print("\nAbuse Ring Member Count by Topology:")
    print(tabulate(topology_stats, headers=["Topology Archetype", "Abuse Ring Member Count"], tablefmt="grid"))

    # Load DataFrames to print examples
    users_df = pd.read_csv(paths["users_csv"])
    transactions_df = pd.read_csv(paths["transactions_csv"])

    display_examples(users_df, transactions_df)

    print("\n" + "=" * 80)
    print(f"Generated files successfully saved to: {os.path.abspath(args.out_dir)}")
    print(f"  - Users CSV: {paths['users_csv']}")
    print(f"  - Transactions CSV: {paths['transactions_csv']}")
    print(f"  - Metadata JSON: {paths['metadata_json']}")
    print("=" * 80)


if __name__ == "__main__":
    main()
