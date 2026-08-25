export interface UserSession {
  user_id: string;
  merchant_id: string;
  full_name: string;
  email: string;
  company_name: string;
  api_key_masked: string;
}

export interface SignupRequestPayload {
  full_name: string;
  email: string;
  company_name: string;
  password: string;
}

export interface SignupResponsePayload {
  merchant_id: string;
  user_id: string;
  full_name: string;
  email: string;
  company_name: string;
  api_key: string;
  session_token: string;
  created_at: string;
}

export interface LoginRequestPayload {
  email: string;
  password: string;
}

export interface LoginResponsePayload {
  merchant_id: string;
  user_id: string;
  full_name: string;
  email: string;
  company_name: string;
  session_token: string;
  api_key_masked: string;
}

export interface RotateKeyResponsePayload {
  new_api_key: string;
  key_prefix: string;
  created_at: string;
  message: string;
}

export interface LiveMerchantMetrics {
  merchant_id: string;
  total_transactions: number;
  approvals: number;
  reviews: number;
  blocks: number;
  approval_rate: number;
  review_rate: number;
  block_rate: number;
  average_risk_score: number;
  recent_transactions: any[];
  zero_data_state: boolean;
  last_evaluated_at?: string;
}
