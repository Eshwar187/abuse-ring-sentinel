"""
Retry Policy and Backoff Calculator for Outbound Merchant HTTP Requests.
"""

from __future__ import annotations
import asyncio
from typing import Optional, Set


RETRYABLE_STATUS_CODES: Set[int] = {408, 429, 500, 502, 503, 504}
NON_RETRYABLE_STATUS_CODES: Set[int] = {400, 401, 403, 404, 405, 409, 410, 422}


class RetryPolicy:
    """
    Bounded exponential backoff retry manager for outbound merchant requests.
    """

    def __init__(self, max_retries: int = 2, base_delay_seconds: float = 0.5, max_delay_seconds: float = 5.0):
        self.max_retries = max(0, min(max_retries, 5))
        self.base_delay_seconds = base_delay_seconds
        self.max_delay_seconds = max_delay_seconds

    def should_retry(self, attempt_number: int, http_status: Optional[int], is_network_error: bool = False) -> bool:
        """
        Determines whether a failed attempt should be retried.
        """
        if attempt_number > self.max_retries:
            return False

        if is_network_error:
            return True

        if http_status is not None:
            if http_status in RETRYABLE_STATUS_CODES:
                return True
            if http_status in NON_RETRYABLE_STATUS_CODES:
                return False

        return False

    def get_backoff_delay(self, attempt_number: int) -> float:
        """
        Calculates exponential backoff delay with jitter bounds: base * 2^(attempt - 1).
        """
        delay = self.base_delay_seconds * (2 ** max(0, attempt_number - 1))
        return min(delay, self.max_delay_seconds)

    async def wait_backoff(self, attempt_number: int) -> None:
        """
        Asynchronously pauses execution for backoff duration.
        """
        delay = self.get_backoff_delay(attempt_number)
        await asyncio.sleep(delay)
