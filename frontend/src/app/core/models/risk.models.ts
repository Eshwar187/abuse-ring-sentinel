export type RiskDecision = 'APPROVE' | 'REVIEW' | 'BLOCK';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ReasonCodeItem {
  code: string;
  message: string;
  evidence: Record<string, any>;
}

export interface TransactionEvidence {
  account_age_days?: number;
  user_tx_count_24h?: number;
  user_tx_count_1h?: number;
  device_prior_user_count?: number;
  ip_prior_user_count?: number;
  payment_prior_user_count?: number;
  shipping_address_prior_user_count?: number;
  billing_address_prior_user_count?: number;
  number_of_prior_connected_users?: number;
  max_shared_entity_user_count?: number;
  shared_entity_types_count?: number;
  connected_component_user_count?: number;
  connected_component_density?: number;
  is_promo_used?: number;
  amount?: number;
  user_promo_rate?: number;
  amount_to_user_mean_ratio?: number;
  hour_of_day?: number;
}

export interface PredictRequest {
  transaction_id: string;
  features: Record<string, any>;
}

export interface PredictResponse {
  transaction_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  decision: RiskDecision;
  reason_codes: ReasonCodeItem[];
  evidence: TransactionEvidence;
  model_version: string;
  feature_version: string;
  policy_version: string;
  evaluated_at: string;
  request_id?: string;
  latency_ms?: number;
}

export interface HealthResponse {
  status: string;
  model_name: string;
  model_type: string;
  model_version: string;
  feature_version: string;
  policy_version: string;
  environment?: string;
  error?: string;
}

export interface MetricsSummary {
  total_inference_requests: number;
  decision_breakdown: {
    approvals: number;
    reviews: number;
    blocks: number;
  };
  error_count: number;
  performance: {
    avg_latency_ms: number;
    p95_latency_ms: number;
    sample_window_size: number;
  };
  server_environment: string;
}

export interface TransactionListItem {
  transaction_id: string;
  timestamp: string;
  amount: number;
  currency?: string;
  product_category?: string;
  risk_score: number;
  risk_level: RiskLevel;
  decision: RiskDecision;
  primary_reason: string;
  user_id?: string;
  is_promo_used?: number;
  connected_users?: number;
  features?: Record<string, any>;
  request_id?: string;
  latency_ms?: number;
}

export interface AuditRecord {
  request_id?: string;
  transaction_id: string;
  timestamp: string;
  risk_score: number;
  risk_level: RiskLevel;
  decision: RiskDecision;
  reason_codes: string[];
  model_version: string;
  feature_version: string;
  policy_version: string;
  latency_ms?: number;
}

export interface DemoScenario {
  id: string;
  title: string;
  category: string;
  description: string;
  expectedDecision: RiskDecision;
  expectedLevel: RiskLevel;
  keySignal: string;
  transaction_id: string;
  features: Record<string, any>;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: 'USER' | 'DEVICE' | 'IP' | 'PAYMENT' | 'ADDRESS';
  isRisk?: boolean;
  degree?: number;
  details?: Record<string, any>;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: 'SHARED_DEVICE' | 'SHARED_IP' | 'SHARED_PAYMENT' | 'SHARED_ADDRESS';
}

// ---------------------------------------------------------------------------
// Phase 12 — Real Merchant Integration (API v1) Models
// ---------------------------------------------------------------------------

export interface RawTransactionEvent {
  transaction_id: string;
  user_id: string;
  amount: number;
  currency: string;
  timestamp: string;
  product_category?: string;
  device_id?: string;
  ip_address?: string;
  payment_method_id?: string;
  billing_address_id?: string;
  shipping_address_id?: string;
  email_domain?: string;
  promo_code?: string;
  is_promo_used?: number;
  custom_fields?: Record<string, any>;
}

export interface DataQualityMetadata {
  status: 'cold_start' | 'sufficient_history';
  historical_transactions: number;
  graph_connected_entities: number;
}

export interface RiskEvaluateResponse {
  transaction_id: string;
  merchant_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  decision: RiskDecision;
  reason_codes: ReasonCodeItem[];
  evidence: Record<string, any>;
  data_quality: DataQualityMetadata;
  model_version: string;
  feature_version: string;
  policy_version: string;
  evaluated_at: string;
  request_id: string;
  latency_ms: number;
}

export interface MerchantConfigResponse {
  merchant_id: string;
  api_version: string;
  model_name: string;
  model_type: string;
  model_version: string;
  feature_version: string;
  policy_version: string;
  threshold: number;
  supported_event_types: string[];
  required_fields: string[];
  environment: string;
}

export interface MerchantHealthResponse {
  status: string;
  merchant_id: string;
  integration_status: string;
  model_status: string;
  state_store_status: string;
  last_processed_event?: string;
  environment: string;
  timestamp: string;
}

export interface OutcomePayload {
  transaction_id: string;
  outcome: 'CONFIRMED_FRAUD' | 'LEGITIMATE' | 'MANUAL_REVIEW_CONFIRMED' | 'CHARGEBACK' | 'UNKNOWN';
  timestamp?: string;
  notes?: string;
}
