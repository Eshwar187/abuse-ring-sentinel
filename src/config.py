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

    # Database Configuration (MySQL 8.x + PyMySQL)
    db_engine: str = os.getenv("DB_ENGINE", "mysql").lower()
    mysql_host: str = os.getenv("MYSQL_HOST", "127.0.0.1")
    mysql_port: int = int(os.getenv("MYSQL_PORT", "3306"))
    mysql_database: str = os.getenv("MYSQL_DATABASE", "abuse_ring_sentinel")
    mysql_user: str = os.getenv("MYSQL_USER", "root")
    mysql_password: str = os.getenv("MYSQL_PASSWORD", "")
    mysql_pool_size: int = int(os.getenv("MYSQL_POOL_SIZE", "10"))
    mysql_max_overflow: int = int(os.getenv("MYSQL_MAX_OVERFLOW", "20"))
    mysql_pool_timeout: int = int(os.getenv("MYSQL_POOL_TIMEOUT", "30"))
    mysql_pool_recycle: int = int(os.getenv("MYSQL_POOL_RECYCLE", "3600"))
    mysql_test_database: str = os.getenv("MYSQL_TEST_DATABASE", "abuse_ring_sentinel_test")

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

    def get_mysql_url(self, database: str = None) -> str:
        """Constructs full SQLAlchemy connection URL for MySQL."""
        db_name = database or self.mysql_database
        pwd = f":{self.mysql_password}" if self.mysql_password else ""
        return f"mysql+pymysql://{self.mysql_user}{pwd}@{self.mysql_host}:{self.mysql_port}/{db_name}?charset=utf8mb4"

    def get_masked_mysql_url(self, database: str = None) -> str:
        """Returns safe masked connection URL for logging."""
        db_name = database or self.mysql_database
        pwd = ":••••••••" if self.mysql_password else ""
        return f"mysql+pymysql://{self.mysql_user}{pwd}@{self.mysql_host}:{self.mysql_port}/{db_name}"


# Global default configuration instance
config = AppConfig()
