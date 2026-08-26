"""
Production Configuration for Abuse-Ring Sentinel.

Reads configuration settings from environment variables and .env file.
Supports development, testing, cloud, and production runtime profiles (including Aiven, AWS, Render).
"""

import os
from pathlib import Path
from typing import List, Optional, Dict, Any
from urllib.parse import quote_plus, urlparse, parse_qs, urlencode, urlunparse
from dataclasses import dataclass, field

# Automatically load .env file from project root if available
try:
    from dotenv import load_dotenv
    root_dir = Path(__file__).resolve().parent.parent
    env_file = root_dir / ".env"
    if env_file.exists():
        load_dotenv(dotenv_path=env_file, override=False)
    else:
        load_dotenv(override=False)
except Exception:
    pass


@dataclass
class AppConfig:
    app_env: str = field(default_factory=lambda: os.getenv("APP_ENV", "development").lower())
    host: str = field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    port: int = field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    
    # Comma-separated list of allowed CORS origins (allow all in prod/dev if specified, or specific frontend URLs)
    cors_origins_raw: str = field(
        default_factory=lambda: os.getenv(
            "CORS_ORIGINS",
            "http://localhost:4200,http://localhost:8000,http://127.0.0.1:4200,http://127.0.0.1:8000,https://*.vercel.app,*"
        )
    )
    
    model_path: str = field(default_factory=lambda: os.getenv("MODEL_PATH", "models/model_f.joblib"))
    audit_log_path: str = field(default_factory=lambda: os.getenv("AUDIT_LOG_PATH", "reports/audit_log.jsonl"))
    log_level: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO").upper())
    
    # Rate Limiting (Requests per minute per client IP)
    rate_limit_per_minute: int = field(default_factory=lambda: int(os.getenv("RATE_LIMIT_PER_MINUTE", "120")))
    
    # Request & Payload Constraints
    max_payload_size_bytes: int = field(default_factory=lambda: int(os.getenv("MAX_PAYLOAD_SIZE_BYTES", "1048576")))  # 1MB
    request_timeout_seconds: float = field(default_factory=lambda: float(os.getenv("REQUEST_TIMEOUT_SECONDS", "30.0")))

    # Database Configuration (MySQL 8.x / Aiven / RDS / PyMySQL)
    db_engine: str = field(default_factory=lambda: os.getenv("DB_ENGINE", "mysql").lower())
    database_url: str = field(default_factory=lambda: os.getenv("DATABASE_URL") or os.getenv("MYSQL_URL") or "")
    mysql_host: str = field(default_factory=lambda: os.getenv("MYSQL_HOST", "127.0.0.1"))
    mysql_port: int = field(default_factory=lambda: int(os.getenv("MYSQL_PORT", "3306")))
    mysql_database: str = field(default_factory=lambda: os.getenv("MYSQL_DATABASE", "defaultdb" if "aiven" in os.getenv("MYSQL_HOST", "") else "abuse_ring_sentinel"))
    mysql_user: str = field(default_factory=lambda: os.getenv("MYSQL_USER", "root"))
    mysql_password: str = field(default_factory=lambda: os.getenv("MYSQL_PASSWORD", ""))
    mysql_ssl_mode: str = field(default_factory=lambda: os.getenv("MYSQL_SSL_MODE", "REQUIRED" if "aiven" in os.getenv("MYSQL_HOST", "") or "aiven" in (os.getenv("DATABASE_URL") or "") else "DISABLED").upper())
    mysql_pool_size: int = field(default_factory=lambda: int(os.getenv("MYSQL_POOL_SIZE", "10")))
    mysql_max_overflow: int = field(default_factory=lambda: int(os.getenv("MYSQL_MAX_OVERFLOW", "20")))
    mysql_pool_timeout: int = field(default_factory=lambda: int(os.getenv("MYSQL_POOL_TIMEOUT", "30")))
    mysql_pool_recycle: int = field(default_factory=lambda: int(os.getenv("MYSQL_POOL_RECYCLE", "3600")))
    mysql_test_database: str = field(default_factory=lambda: os.getenv("MYSQL_TEST_DATABASE", "abuse_ring_sentinel_test"))

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
        if "*" in origins:
            return ["*"]
        return origins if origins else ["http://localhost:4200", "http://localhost:8000"]

    def get_mysql_url(self, database: str = None) -> str:
        """
        Constructs full SQLAlchemy connection URL for MySQL with URL-encoded credentials
        and SSL parameters (supporting direct DATABASE_URL or individual config).
        """
        # If full connection URI provided
        if self.database_url:
            raw_url = self.database_url.strip()
            # Normalize scheme: mysql:// -> mysql+pymysql://
            if raw_url.startswith("mysql://"):
                raw_url = "mysql+pymysql://" + raw_url[len("mysql://"):]
            elif not raw_url.startswith("mysql+pymysql://"):
                raw_url = f"mysql+pymysql://{raw_url}"
            
            # If a specific target database is requested (e.g. for test DB)
            if database:
                parsed = urlparse(raw_url)
                raw_url = urlunparse((
                    parsed.scheme,
                    parsed.netloc,
                    f"/{database}",
                    parsed.params,
                    parsed.query,
                    parsed.fragment,
                ))
            return raw_url

        db_name = database or self.mysql_database
        user = quote_plus(self.mysql_user) if self.mysql_user else "root"
        pwd = f":{quote_plus(self.mysql_password)}" if self.mysql_password else ""
        url = f"mysql+pymysql://{user}{pwd}@{self.mysql_host}:{self.mysql_port}/{db_name}?charset=utf8mb4"
        if self.mysql_ssl_mode in ("REQUIRED", "VERIFY_CA", "VERIFY_IDENTITY"):
            url += "&ssl_mode=REQUIRED"
        return url

    def get_masked_mysql_url(self, database: str = None) -> str:
        """Returns safe masked connection URL for logging."""
        if self.database_url:
            try:
                parsed = urlparse(self.database_url)
                netloc = parsed.netloc
                if "@" in netloc:
                    user_part, host_part = netloc.split("@", 1)
                    user = user_part.split(":", 1)[0] if ":" in user_part else user_part
                    netloc = f"{user}:••••••••@{host_part}"
                return f"mysql+pymysql://{netloc}{parsed.path}"
            except Exception:
                return "mysql+pymysql://••••••••:••••••••@cloud-mysql"

        db_name = database or self.mysql_database
        pwd = ":••••••••" if self.mysql_password else ""
        return f"mysql+pymysql://{self.mysql_user}{pwd}@{self.mysql_host}:{self.mysql_port}/{db_name}"


# Global default configuration instance
config = AppConfig()
