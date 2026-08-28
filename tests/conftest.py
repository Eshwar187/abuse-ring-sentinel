"""
Pytest configuration for Abuse-Ring Sentinel.
Sets up test environment variables and fixtures.
"""

import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Set test environment
os.environ["APP_ENV"] = "testing"
os.environ["DB_ENGINE"] = "sqlite"
os.environ["SQLITE_DB_PATH"] = "data/runtime/test_state.db"
