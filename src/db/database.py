"""
SQLAlchemy 2.0 Database Connection & Session Management for Abuse-Ring Sentinel.
Supports Connection Pooling, Health Probes, and Schema Initialization.
"""

import time
from typing import Generator, Optional, Tuple, Dict, Any
from contextlib import contextmanager

from sqlalchemy import create_engine, text, Engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool, NullPool

from src.config import config
from src.db.models import Base


_engine_cache: Dict[str, Engine] = {}
_sessionmaker_cache: Dict[str, sessionmaker[Session]] = {}


def get_engine(database: Optional[str] = None, is_test: bool = False) -> Engine:
    """
    Returns a configured SQLAlchemy engine with connection pooling.
    Caches engine instances per target database.
    """
    db_name = database or (config.mysql_test_database if is_test else config.mysql_database)
    cache_key = f"{db_name}_{is_test}"

    if cache_key in _engine_cache:
        return _engine_cache[cache_key]

    url = config.get_mysql_url(database=db_name)
    
    connect_args = {}
    if config.mysql_ssl_mode in ("REQUIRED", "VERIFY_CA", "VERIFY_IDENTITY") or "ssl" in url.lower() or "aiven" in url.lower():
        connect_args["ssl"] = {"ssl_mode": "REQUIRED"}

    # Configure production pool
    engine = create_engine(
        url,
        connect_args=connect_args,
        poolclass=QueuePool,
        pool_size=config.mysql_pool_size,
        max_overflow=config.mysql_max_overflow,
        pool_timeout=config.mysql_pool_timeout,
        pool_recycle=config.mysql_pool_recycle,
        pool_pre_ping=True,  # Test connection liveness before checkout
        echo=False,
    )

    _engine_cache[cache_key] = engine
    return engine


def get_session_factory(database: Optional[str] = None, is_test: bool = False) -> sessionmaker[Session]:
    """Returns cached sessionmaker for the database."""
    db_name = database or (config.mysql_test_database if is_test else config.mysql_database)
    cache_key = f"{db_name}_{is_test}"

    if cache_key not in _sessionmaker_cache:
        engine = get_engine(database=db_name, is_test=is_test)
        _sessionmaker_cache[cache_key] = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    return _sessionmaker_cache[cache_key]


@contextmanager
def get_db_session(database: Optional[str] = None, is_test: bool = False) -> Generator[Session, None, None]:
    """
    Context manager providing a transactional database session with auto-commit/rollback.
    """
    factory = get_session_factory(database=database, is_test=is_test)
    session: Session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def check_db_connection(database: Optional[str] = None) -> Dict[str, Any]:
    """
    Performs an active database probe ('SELECT 1') and returns health metrics.
    Truthfully reports connection state without leaking credentials.
    """
    db_name = database or config.mysql_database
    start_time = time.perf_counter()
    try:
        engine = get_engine(database=db_name)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            if result == 1:
                return {
                    "status": "connected",
                    "engine": "mysql",
                    "database": db_name,
                    "latency_ms": latency_ms,
                    "error": None,
                }
            else:
                return {
                    "status": "degraded",
                    "engine": "mysql",
                    "database": db_name,
                    "latency_ms": latency_ms,
                    "error": "Unexpected query response",
                }
    except Exception as e:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        # Sanitize error string to prevent credential exposure
        err_msg = str(e)
        if "password" in err_msg.lower():
            err_msg = "Authentication failed (Access denied)"
        elif "can't connect" in err_msg.lower() or "connection refused" in err_msg.lower():
            err_msg = "Database server unreachable on specified host:port"
        return {
            "status": "disconnected",
            "engine": "mysql",
            "database": db_name,
            "latency_ms": latency_ms,
            "error": err_msg,
        }


def init_db(database: Optional[str] = None, is_test: bool = False) -> None:
    """Initializes all table definitions in MySQL."""
    engine = get_engine(database=database, is_test=is_test)
    Base.metadata.create_all(engine)
