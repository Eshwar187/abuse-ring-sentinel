"""
Production Configuration for Abuse-Ring Sentinel.

Reads configuration settings from environment variables with sensible defaults.
Supports development, testing, and production runtime profiles.
"""

import os
from typing import List
from dataclasses import dataclass, field


@dataclass
class AppConfig:
    app_env: str = os.getenv("APP_ENV", "development").lower()
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    
    # Comma-separated list of allowed CORS origins
    cors_origins_raw: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:4200,http://localhost:8000,http://127.0.0.1:4200,http://127.0.0.1:8000"
    )
    
    model_path: str = os.getenv("MODEL_PATH", "models/model_f.joblib")
    audit_log_path: str = os.getenv("AUDIT_LOG_PATH", "reports/audit_log.jsonl")
    log_level: str = os.getenv("LOG_LEVEL", "INFO").upper()
    
    # Rate Limiting (Requests per minute per client IP)
    rate_limit_per_minute: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "120"))
    
    # Request & Payload Constraints
    max_payload_size_bytes: int = int(os.getenv("MAX_PAYLOAD_SIZE_BYTES", "1048576"))  # 1MB
    request_timeout_seconds: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "30.0"))

    @property
    def environment(self) -> str:
        return self.app_env

    @property
    def is_production(self) -> bool:
        return self.app_env in ("production", "prod")

    @property
    def cors_origins(self) -> List[str]:
        if not self.is_production and self.cors_origins_raw.strip() == "*":
            return ["*"]
        origins = [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]
        return origins if origins else ["http://localhost:4200", "http://localhost:8000"]


# Global default configuration instance
config = AppConfig()
