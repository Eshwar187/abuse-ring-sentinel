"""
Pydantic Schemas for VigilAI Central Admin & Maintenance Management.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="SuperAdmin username")
    password: str = Field(..., description="SuperAdmin password")


class AdminLoginResponse(BaseModel):
    success: bool = True
    token: str
    admin_id: str
    username: str
    role: str = "superadmin"
    issued_at: str
    expires_at: str


class AdminMerchantItem(BaseModel):
    merchant_id: str
    company_name: str
    email: str
    full_name: str
    api_key_prefix: str
    tier: str = "ENTERPRISE"
    status: str = "ACTIVE"  # ACTIVE | SUSPENDED
    created_at: str
    total_transactions: int = 0
    total_volume_usd: float = 0.0
    blocked_count: int = 0
    review_count: int = 0
    approved_count: int = 0
    fraud_block_rate: float = 0.0


class AdminMerchantsResponse(BaseModel):
    total_merchants: int
    active_count: int
    suspended_count: int
    merchants: List[AdminMerchantItem]


class AdminToggleMerchantRequest(BaseModel):
    status: Optional[str] = None  # ACTIVE | SUSPENDED (if omitted, toggles current)
    reason: Optional[str] = "Admin action"


class AdminPolicyConfig(BaseModel):
    model_name: str = "abuse_ring_sentinel"
    model_type: str = "hist_gradient_boosting"
    model_version: str = "phase3-v1"
    feature_version: str = "features-v2"
    block_threshold: float = 0.90
    review_threshold: float = 0.50
    sensitivity_preset: str = "BALANCED"  # RELAXED | BALANCED | STRICT | MAXIMUM_QUARANTINE
    rate_limit_per_minute: int = 120
    is_frozen: bool = True
    last_updated: str


class AdminUpdatePolicyRequest(BaseModel):
    block_threshold: Optional[float] = None
    review_threshold: Optional[float] = None
    sensitivity_preset: Optional[str] = None
    rate_limit_per_minute: Optional[int] = None


class MaintenanceConfig(BaseModel):
    is_active: bool = False
    title: str = "Scheduled Core Engine Upgrade & Maintenance"
    message: str = "VigilAI fraud intelligence engine is undergoing scheduled model calibration and database index optimization. Real-time protection remains staged."
    maintenance_type: str = "SCHEDULED_UPGRADE"  # SCHEDULED_UPGRADE | THREAT_CONTAINMENT | DB_MAINTENANCE | EMERGENCY_PATCH
    started_at: Optional[str] = None
    estimated_end_time: Optional[str] = None
    duration_minutes: int = 60
    allow_admin_bypass: bool = True
    bypass_ips: List[str] = []
    affected_services: List[str] = ["Inference API", "Entity Graph Sync", "Batch Ingestion"]


class UpdateMaintenanceRequest(BaseModel):
    is_active: bool
    title: Optional[str] = None
    message: Optional[str] = None
    maintenance_type: Optional[str] = None
    duration_minutes: Optional[int] = None
    affected_services: Optional[List[str]] = None


class AdminSystemStatusResponse(BaseModel):
    status: str = "OPERATIONAL"  # OPERATIONAL | DEGRADED | MAINTENANCE | EMERGENCY
    uptime_seconds: float
    app_version: str = "1.0.0"
    environment: str = "production"
    model_health: Dict[str, Any]
    database_health: Dict[str, Any]
    telemetry: Dict[str, Any]
    maintenance: MaintenanceConfig
    active_admins_count: int = 1


class AdminEmergencyActionRequest(BaseModel):
    action: str  # FLUSH_SESSIONS | QUARANTINE_TRAFFIC | RESET_CACHE | RELOAD_MODELS | EMERGENCY_SHUTDOWN
    reason: str = "SuperAdmin manual trigger"


class AdminEmergencyActionResponse(BaseModel):
    success: bool
    action: str
    message: str
    executed_at: str
    affected_records: int = 0
