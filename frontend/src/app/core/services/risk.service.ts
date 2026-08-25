import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  PredictRequest,
  PredictResponse,
  AuditRecord,
  RawTransactionEvent,
  RiskEvaluateResponse,
  MerchantConfigResponse,
  MerchantHealthResponse,
  OutcomePayload,
} from '../models/risk.models';

@Injectable({
  providedIn: 'root',
})
export class RiskService {
  private api = inject(ApiService);

  readonly lastEvaluation = signal<PredictResponse | null>(null);
  readonly lastRawEvaluation = signal<RiskEvaluateResponse | null>(null);
  readonly sessionAuditLog = signal<AuditRecord[]>([]);

  // -------------------------------------------------------------------------
  // Precomputed Features Endpoint (POST /predict)
  // -------------------------------------------------------------------------
  evaluateTransaction(request: PredictRequest): Observable<PredictResponse> {
    return this.api.post<PredictResponse>('/predict', request).pipe(
      tap((response) => {
        this.lastEvaluation.set(response);
        this.appendAuditLog(response);
      })
    );
  }

  // -------------------------------------------------------------------------
  // Phase 12 — Raw Merchant Integration Endpoint (POST /api/v1/risk/evaluate)
  // -------------------------------------------------------------------------
  evaluateRawTransaction(
    request: RawTransactionEvent,
    apiKey: string = 'ars_live_test_merchant_01',
    idempotencyKey?: string
  ): Observable<RiskEvaluateResponse> {
    const headers: Record<string, string> = {
      'X-API-Key': apiKey,
    };
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    return this.api.post<RiskEvaluateResponse>('/api/v1/risk/evaluate', request, { headers }).pipe(
      tap((response) => {
        this.lastRawEvaluation.set(response);
        this.appendRawAuditLog(response);
      })
    );
  }

  getMerchantConfig(apiKey: string = 'ars_live_test_merchant_01'): Observable<MerchantConfigResponse> {
    return this.api.get<MerchantConfigResponse>('/api/v1/merchant/config', {
      headers: { 'X-API-Key': apiKey },
    });
  }

  getMerchantHealth(apiKey: string = 'ars_live_test_merchant_01'): Observable<MerchantHealthResponse> {
    return this.api.get<MerchantHealthResponse>('/api/v1/merchant/health', {
      headers: { 'X-API-Key': apiKey },
    });
  }

  recordOutcome(payload: OutcomePayload, apiKey: string = 'ars_live_test_merchant_01'): Observable<any> {
    return this.api.post('/api/v1/outcomes', payload, {
      headers: { 'X-API-Key': apiKey },
    });
  }

  getEvaluatedTransaction(transactionId: string, apiKey: string = 'ars_live_test_merchant_01'): Observable<any> {
    return this.api.get(`/api/v1/risk/${transactionId}`, {
      headers: { 'X-API-Key': apiKey },
    });
  }

  private appendAuditLog(res: PredictResponse) {
    const record: AuditRecord = {
      transaction_id: res.transaction_id,
      timestamp: res.evaluated_at || new Date().toISOString(),
      risk_score: res.risk_score,
      risk_level: res.risk_level,
      decision: res.decision,
      reason_codes: res.reason_codes.map((r) => r.code),
      model_version: res.model_version,
      feature_version: res.feature_version,
      policy_version: res.policy_version,
    };
    this.sessionAuditLog.update((logs) => [record, ...logs]);
  }

  private appendRawAuditLog(res: RiskEvaluateResponse) {
    const record: AuditRecord = {
      transaction_id: res.transaction_id,
      timestamp: res.evaluated_at || new Date().toISOString(),
      risk_score: res.risk_score,
      risk_level: res.risk_level,
      decision: res.decision,
      reason_codes: res.reason_codes.map((r) => r.code),
      model_version: res.model_version,
      feature_version: res.feature_version,
      policy_version: res.policy_version,
      latency_ms: res.latency_ms,
    };
    this.sessionAuditLog.update((logs) => [record, ...logs]);
  }
}
