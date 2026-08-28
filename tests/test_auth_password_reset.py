"""
Unit & Integration Tests for Password Reset Workflow (VigilAI).
"""

import uuid
import pytest
import httpx
from api.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_forgot_password_and_reset_flow(anyio_backend):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Register a test merchant with unique email
        email = f"reset_{uuid.uuid4().hex[:8]}@merchant.io"
        signup_res = await client.post("/api/v1/auth/signup", json={
            "full_name": "Reset Test Merchant",
            "email": email,
            "company_name": "Reset Corp",
            "password": "OldPassword123!",
        })
        assert signup_res.status_code == 201

        # 2. Trigger forgot password
        forgot_res = await client.post("/api/v1/auth/forgot-password", json={
            "email": email,
        })
        assert forgot_res.status_code == 200
        data = forgot_res.json()
        assert data["success"] is True
        token = data.get("reset_token")
        assert token is not None
        assert len(token) >= 32

        # 3. Verify reset token
        verify_res = await client.get(f"/api/v1/auth/verify-reset-token?token={token}")
        assert verify_res.status_code == 200
        v_data = verify_res.json()
        assert v_data["valid"] is True
        assert v_data["email"] == email

        # 4. Attempt reset with invalid token
        bad_reset = await client.post("/api/v1/auth/reset-password", json={
            "token": "invalid_fake_token_12345",
            "new_password": "NewSecretPassword123!",
        })
        assert bad_reset.status_code == 400

        # 5. Attempt reset with short password
        short_pwd = await client.post("/api/v1/auth/reset-password", json={
            "token": token,
            "new_password": "short",
        })
        assert short_pwd.status_code == 422

        # 6. Successfully reset password
        good_reset = await client.post("/api/v1/auth/reset-password", json={
            "token": token,
            "new_password": "BrandNewPassword2026!",
        })
        assert good_reset.status_code == 200
        assert good_reset.json()["success"] is True

        # 7. Token reuse should fail (single-use guarantee)
        reuse_res = await client.post("/api/v1/auth/reset-password", json={
            "token": token,
            "new_password": "AnotherPassword2026!",
        })
        assert reuse_res.status_code == 400

        # 8. Login with old password should fail
        old_login = await client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "OldPassword123!",
        })
        assert old_login.status_code == 401

        # 9. Login with new password should succeed
        new_login = await client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "BrandNewPassword2026!",
        })
        assert new_login.status_code == 200
        assert new_login.json()["email"] == email
