"""
Security and Cryptography Utilities for Authentication & API Key Management.
"""

import os
import hmac
import hashlib
import secrets
from typing import Tuple


def hash_password(password: str) -> Tuple[str, str]:
    """Hashes password using PBKDF2-HMAC-SHA256 with 100,000 iterations and a cryptographic salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return key.hex(), salt


def verify_password(password: str, password_hash: str, password_salt: str) -> bool:
    """Verifies a password against the stored PBKDF2 hash using constant-time comparison."""
    test_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        password_salt.encode("utf-8"),
        100_000,
    )
    return hmac.compare_digest(test_key.hex(), password_hash)


def generate_session_token() -> str:
    """Generates a secure 256-bit random session token."""
    return secrets.token_hex(32)


def generate_api_key(prefix: str = "ars_live_") -> Tuple[str, str, str]:
    """
    Generates a secure merchant API key.
    Returns (raw_key, key_hash, key_prefix).
    The raw_key is only presented to the merchant once.
    The key_hash is stored in the database.
    """
    random_secret = secrets.token_hex(20)
    raw_key = f"{prefix}{random_secret}"
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    key_prefix = raw_key[:12] + "..."
    return raw_key, key_hash, key_prefix


def hash_api_key(raw_key: str) -> str:
    """Computes SHA-256 hash of an API key for lookup."""
    return hashlib.sha256(raw_key.strip().encode("utf-8")).hexdigest()
