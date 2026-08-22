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
  device_prior_user_count?: number;
  ip_prior_user_count?: number;
  payment_prior_user_count?: number;
  shipping_address_prior_user_count?: number;
  billing_address_prior_user_count?: number;
  number_of_prior_connected_users?: number;
  max_shared_entity_user_count?: number;
  shared_entity_types_count?: number;
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
}

export interface HealthResponse {
  status: string;
  model_name: string;
  model_type: string;
  model_version: string;
  feature_version: string;
  policy_version: string;
}

export interface TransactionListItem {
  transaction_id: string;
  timestamp: string;
  amount: number;
  product_category: string;
  risk_score: number;
  risk_level: RiskLevel;
  decision: RiskDecision;
  primary_reason: string;
  user_id?: string;
  is_promo_used?: number;
  connected_users?: number;
  features?: Record<string, any>;
}

export interface AuditRecord {
  transaction_id: string;
  timestamp: string;
  risk_score: number;
  risk_level: RiskLevel;
  decision: RiskDecision;
  reason_codes: string[];
  model_version: string;
  feature_version: string;
  policy_version: string;
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
