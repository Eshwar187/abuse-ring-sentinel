"""
HMAC-SHA256 Request Signing and Verification Utilities for Outbound Webhooks.
"""

from __future__ import annotations
import hmac
import hashlib
from typing import Union


def generate_action_signature(payload: Union[bytes, str], secret: str) -> str:
    """
    Computes an HMAC-SHA256 signature for the given payload using the secret key.
    
    Args:
        payload: Canonical UTF-8 bytes or string of request body
        secret: Webhook signing secret key
        
    Returns:
        Hexadecimal HMAC digest prefixed with 'sha256='
    """
    if isinstance(payload, str):
        payload_bytes = payload.encode("utf-8")
    else:
        payload_bytes = payload

    secret_bytes = secret.encode("utf-8") if isinstance(secret, str) else secret
    mac = hmac.new(secret_bytes, payload_bytes, hashlib.sha256)
    return f"sha256={mac.hexdigest()}"


def verify_action_signature(payload: Union[bytes, str], secret: str, signature: str) -> bool:
    """
    Verifies that the provided HMAC-SHA256 signature matches the payload.
    Uses constant-time comparison to prevent timing side-channel attacks.
    
    Args:
        payload: Canonical UTF-8 bytes or string of request body
        secret: Webhook signing secret key
        signature: Received signature header (e.g. 'sha256=abcdef...' or 'abcdef...')
        
    Returns:
        True if valid, False otherwise
    """
    if not secret or not signature:
        return False

    expected_sig = generate_action_signature(payload, secret)

    # Normalize incoming signature
    clean_sig = signature.strip()
    if not clean_sig.startswith("sha256="):
        clean_sig = f"sha256={clean_sig}"

    return hmac.compare_digest(clean_sig, expected_sig)
