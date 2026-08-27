export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token: string;
  admin_id: string;
  username: string;
  role: string;
  issued_at: string;
  expires_at: string;
}

export interface AdminMerchantItem {
  merchant_id: string;
  company_name: string;
  email: string;
  full_name: string;
  api_key_prefix: string;
  tier: string;
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  total_transactions: number;
  total_volume_usd: number;
  blocked_count: number;
  review_count: number;
  approved_count: number;
  fraud_block_rate: number;
}

export interface AdminMerchantsResponse {
  total_merchants: number;
  active_count: number;
  suspended_count: number;
  merchants: AdminMerchantItem[];
}

export interface AdminPolicyConfig {
  model_name: string;
  model_type: string;
  model_version: string;
  feature_version: string;
  block_threshold: number;
  review_threshold: number;
  sensitivity_preset: 'RELAXED' | 'BALANCED' | 'STRICT' | 'MAXIMUM_QUARANTINE';
  rate_limit_per_minute: number;
  is_frozen: boolean;
  last_updated: string;
}

export interface AdminUpdatePolicyRequest {
  block_threshold?: number;
  review_threshold?: number;
  sensitivity_preset?: string;
  rate_limit_per_minute?: number;
}

export interface MaintenanceConfig {
  is_active: boolean;
  title: string;
  message: string;
  maintenance_type: 'SCHEDULED_UPGRADE' | 'THREAT_CONTAINMENT' | 'DB_MAINTENANCE' | 'EMERGENCY_PATCH';
  started_at?: string | null;
  estimated_end_time?: string | null;
  duration_minutes: number;
  allow_admin_bypass: boolean;
  bypass_ips: string[];
  affected_services: string[];
}

export interface UpdateMaintenanceRequest {
  is_active: boolean;
  title?: string;
  message?: string;
  maintenance_type?: string;
  duration_minutes?: number;
  affected_services?: string[];
}

export interface AdminSystemStatusResponse {
  status: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE' | 'EMERGENCY';
  uptime_seconds: number;
  app_version: string;
  environment: string;
  model_health: Record<string, any>;
  database_health: Record<string, any>;
  telemetry: {
    total_evaluations: number;
    total_fraud_blocked_usd: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    requests_per_second: number;
    memory_usage_mb: number;
    active_graph_nodes: number;
    active_graph_edges: number;
  };
  maintenance: MaintenanceConfig;
  active_admins_count: number;
}

export interface AdminEmergencyActionResponse {
  success: boolean;
  action: string;
  message: string;
  executed_at: string;
  affected_records: number;
}
