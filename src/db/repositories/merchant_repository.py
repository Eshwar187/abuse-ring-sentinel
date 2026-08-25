"""
Merchant Repository for MySQL persistence.
Handles merchant tenant records, credentials, and integration webhook settings.
"""

import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import select, update, delete

from src.db.models import (
    MerchantModel,
    MerchantCredentialModel,
    MerchantIntegrationModel,
)


class MerchantRepository:
    def __init__(self, session: Session):
        self.session = session

    def create_merchant(
        self,
        merchant_id: str,
        company_name: str,
        email: str,
        password_hash: str,
    ) -> MerchantModel:
        now = datetime.utcnow()
        merchant = MerchantModel(
            merchant_id=merchant_id,
            company_name=company_name,
            email=email,
            password_hash=password_hash,
            status="active",
            created_at=now,
            updated_at=now,
        )
        self.session.add(merchant)
        return merchant

    def get_merchant_by_id(self, merchant_id: str) -> Optional[MerchantModel]:
        stmt = select(MerchantModel).where(MerchantModel.merchant_id == merchant_id)
        return self.session.scalar(stmt)

    def get_merchant_by_email(self, email: str) -> Optional[MerchantModel]:
        stmt = select(MerchantModel).where(MerchantModel.email == email)
        return self.session.scalar(stmt)

    def create_credential(
        self,
        merchant_id: str,
        api_key_hash: str,
        api_key_masked: str,
        session_token: Optional[str] = None,
        expires_at: Optional[datetime] = None,
    ) -> MerchantCredentialModel:
        now = datetime.utcnow()
        cred = MerchantCredentialModel(
            merchant_id=merchant_id,
            api_key_hash=api_key_hash,
            api_key_masked=api_key_masked,
            session_token=session_token,
            is_active=True,
            created_at=now,
            expires_at=expires_at,
        )
        self.session.add(cred)
        return cred

    def get_credential_by_api_key_hash(self, api_key_hash: str) -> Optional[MerchantCredentialModel]:
        stmt = select(MerchantCredentialModel).where(
            MerchantCredentialModel.api_key_hash == api_key_hash,
            MerchantCredentialModel.is_active == True,
        )
        return self.session.scalar(stmt)

    def get_credential_by_session_token(self, session_token: str) -> Optional[MerchantCredentialModel]:
        stmt = select(MerchantCredentialModel).where(
            MerchantCredentialModel.session_token == session_token,
            MerchantCredentialModel.is_active == True,
        )
        return self.session.scalar(stmt)

    def save_integration(
        self,
        merchant_id: str,
        action_endpoint_url: Optional[str] = None,
        auth_header_name: str = "Authorization",
        auth_token: Optional[str] = None,
        webhook_secret: Optional[str] = None,
        timeout_seconds: float = 3.0,
        max_retries: int = 2,
        is_active: bool = True,
    ) -> MerchantIntegrationModel:
        now = datetime.utcnow()
        stmt = select(MerchantIntegrationModel).where(MerchantIntegrationModel.merchant_id == merchant_id)
        integration = self.session.scalar(stmt)
        if not integration:
            integration = MerchantIntegrationModel(
                merchant_id=merchant_id,
                action_endpoint_url=action_endpoint_url,
                auth_header_name=auth_header_name,
                auth_token=auth_token,
                webhook_secret=webhook_secret,
                timeout_seconds=timeout_seconds,
                max_retries=max_retries,
                is_active=is_active,
                updated_at=now,
            )
            self.session.add(integration)
        else:
            if action_endpoint_url is not None:
                integration.action_endpoint_url = action_endpoint_url
            integration.auth_header_name = auth_header_name
            if auth_token is not None:
                integration.auth_token = auth_token
            if webhook_secret is not None:
                integration.webhook_secret = webhook_secret
            integration.timeout_seconds = timeout_seconds
            integration.max_retries = max_retries
            integration.is_active = is_active
            integration.updated_at = now
        return integration

    def get_integration(self, merchant_id: str) -> Optional[MerchantIntegrationModel]:
        stmt = select(MerchantIntegrationModel).where(MerchantIntegrationModel.merchant_id == merchant_id)
        return self.session.scalar(stmt)
