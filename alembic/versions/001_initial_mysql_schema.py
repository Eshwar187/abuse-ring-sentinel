"""Initial MySQL Schema for Abuse-Ring Sentinel

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-26 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Merchants table
    op.create_table(
        "merchants",
        sa.Column("merchant_id", sa.String(64), primary_key=True),
        sa.Column("company_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("status", sa.String(32), server_default="active", nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    # 2. Merchant credentials
    op.create_table(
        "merchant_credentials",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("merchant_id", sa.String(64), sa.ForeignKey("merchants.merchant_id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("api_key_hash", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("api_key_masked", sa.String(64), nullable=False),
        sa.Column("session_token", sa.String(255), nullable=True, unique=True, index=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
    )

    # 3. Transactions
    op.create_table(
        "transactions",
        sa.Column("transaction_id", sa.String(128), primary_key=True),
        sa.Column("merchant_id", sa.String(64), nullable=False, index=True),
        sa.Column("user_id", sa.String(128), nullable=False, index=True),
        sa.Column("amount", sa.Double(), nullable=False),
        sa.Column("currency", sa.String(16), server_default="INR", nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False, index=True),
        sa.Column("product_category", sa.String(64), nullable=True),
        sa.Column("device_id", sa.String(128), nullable=True, index=True),
        sa.Column("ip_address", sa.String(64), nullable=True, index=True),
        sa.Column("payment_method_id", sa.String(128), nullable=True, index=True),
        sa.Column("shipping_address_id", sa.String(128), nullable=True),
        sa.Column("billing_address_id", sa.String(128), nullable=True),
        sa.Column("email_domain", sa.String(128), nullable=True),
        sa.Column("promo_code", sa.String(64), nullable=True),
        sa.Column("raw_payload_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("idx_tx_merchant_time", "transactions", ["merchant_id", "timestamp"])
    op.create_index("idx_tx_merchant_user_time", "transactions", ["merchant_id", "user_id", "timestamp"])

    # 4. Users
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("merchant_id", sa.String(64), nullable=False, index=True),
        sa.Column("user_id", sa.String(128), nullable=False, index=True),
        sa.Column("first_seen_at", sa.DateTime(), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(), nullable=False),
        sa.Column("account_age_days", sa.Double(), server_default="0.0", nullable=False),
        sa.Column("tx_count", sa.Integer(), server_default="1", nullable=False),
        sa.Column("total_amount", sa.Double(), server_default="0.0", nullable=False),
        sa.Column("promo_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("email_domain", sa.String(128), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("merchant_id", "user_id", name="uq_user_merchant"),
    )

    # 5. Transaction entities
    op.create_table(
        "transaction_entities",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("merchant_id", sa.String(64), nullable=False, index=True),
        sa.Column("transaction_id", sa.String(128), nullable=False, index=True),
        sa.Column("entity_type", sa.String(32), nullable=False),
        sa.Column("entity_id", sa.String(128), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # 6. Entity relationships
    op.create_table(
        "entity_relationships",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("merchant_id", sa.String(64), nullable=False, index=True),
        sa.Column("entity_type", sa.String(32), nullable=False),
        sa.Column("entity_id", sa.String(128), nullable=False, index=True),
        sa.Column("user_id", sa.String(128), nullable=False, index=True),
        sa.Column("first_seen_at", sa.DateTime(), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(), nullable=False),
        sa.Column("shared_count", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("merchant_id", "entity_type", "entity_id", "user_id", name="uq_entity_rel"),
    )

    # 7. Risk evaluations
    op.create_table(
        "risk_evaluations",
        sa.Column("request_id", sa.String(128), primary_key=True),
        sa.Column("merchant_id", sa.String(64), nullable=False, index=True),
        sa.Column("transaction_id", sa.String(128), nullable=False, index=True),
        sa.Column("risk_score", sa.Double(), nullable=False),
        sa.Column("risk_level", sa.String(16), nullable=False),
        sa.Column("decision", sa.String(16), nullable=False),
        sa.Column("reason_codes_json", sa.Text(), nullable=False),
        sa.Column("evidence_json", sa.Text(), nullable=False),
        sa.Column("features_json", sa.Text(), nullable=False),
        sa.Column("model_version", sa.String(32), nullable=False),
        sa.Column("latency_ms", sa.Double(), nullable=False),
        sa.Column("data_quality_status", sa.String(32), nullable=False),
        sa.Column("evaluated_at", sa.DateTime(), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # 8. Merchant actions
    op.create_table(
        "merchant_actions",
        sa.Column("action_id", sa.String(128), primary_key=True),
        sa.Column("merchant_id", sa.String(64), nullable=False, index=True),
        sa.Column("transaction_id", sa.String(128), nullable=False, index=True),
        sa.Column("decision", sa.String(16), nullable=False),
        sa.Column("action", sa.String(32), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, index=True),
        sa.Column("http_status", sa.Integer(), nullable=True),
        sa.Column("merchant_reference", sa.String(128), nullable=True),
        sa.Column("merchant_message", sa.Text(), nullable=True),
        sa.Column("latency_ms", sa.Double(), server_default="0.0", nullable=False),
        sa.Column("attempt_number", sa.Integer(), server_default="1", nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=True),
        sa.Column("response_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )

    # 9. Action attempts
    op.create_table(
        "action_attempts",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("action_id", sa.String(128), sa.ForeignKey("merchant_actions.action_id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("merchant_id", sa.String(64), nullable=False, index=True),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("http_status", sa.Integer(), nullable=True),
        sa.Column("error_detail", sa.Text(), nullable=True),
        sa.Column("latency_ms", sa.Double(), server_default="0.0", nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # 10. Outcomes
    op.create_table(
        "outcomes",
        sa.Column("transaction_id", sa.String(128), primary_key=True),
        sa.Column("merchant_id", sa.String(64), nullable=False, index=True),
        sa.Column("outcome", sa.String(64), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("outcome_timestamp", sa.DateTime(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(), nullable=False),
    )

    # 11. Idempotency records
    op.create_table(
        "idempotency_records",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("merchant_id", sa.String(64), nullable=False, index=True),
        sa.Column("idempotency_key", sa.String(128), nullable=False, index=True),
        sa.Column("transaction_id", sa.String(128), nullable=False, index=True),
        sa.Column("response_hash", sa.String(128), nullable=False),
        sa.Column("response_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("merchant_id", "idempotency_key", name="uq_idempotency_merchant"),
    )

    # 12. Audit events
    op.create_table(
        "audit_events",
        sa.Column("event_id", sa.String(128), primary_key=True),
        sa.Column("merchant_id", sa.String(64), nullable=False, index=True),
        sa.Column("transaction_id", sa.String(128), nullable=True, index=True),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("actor", sa.String(128), server_default="system", nullable=False),
        sa.Column("details_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, index=True),
    )

    # 13. Merchant integrations
    op.create_table(
        "merchant_integrations",
        sa.Column("merchant_id", sa.String(64), sa.ForeignKey("merchants.merchant_id", ondelete="CASCADE"), primary_key=True),
        sa.Column("action_endpoint_url", sa.String(512), nullable=True),
        sa.Column("auth_header_name", sa.String(64), server_default="Authorization", nullable=False),
        sa.Column("auth_token", sa.String(512), nullable=True),
        sa.Column("webhook_secret", sa.String(512), nullable=True),
        sa.Column("timeout_seconds", sa.Double(), server_default="3.0", nullable=False),
        sa.Column("max_retries", sa.Integer(), server_default="2", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("merchant_integrations")
    op.drop_table("audit_events")
    op.drop_table("idempotency_records")
    op.drop_table("outcomes")
    op.drop_table("action_attempts")
    op.drop_table("merchant_actions")
    op.drop_table("risk_evaluations")
    op.drop_table("entity_relationships")
    op.drop_table("transaction_entities")
    op.drop_table("users")
    op.drop_table("transactions")
    op.drop_table("merchant_credentials")
    op.drop_table("merchants")
