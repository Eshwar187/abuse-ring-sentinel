import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { PredictRequest, PredictResponse, AuditRecord } from '../models/risk.models';

@Injectable({
  providedIn: 'root',
})
export class RiskService {
  private api = inject(ApiService);

  readonly lastEvaluation = signal<PredictResponse | null>(null);
  readonly sessionAuditLog = signal<AuditRecord[]>([]);

  evaluateTransaction(request: PredictRequest): Observable<PredictResponse> {
    return this.api.post<PredictResponse>('/predict', request).pipe(
      tap((response) => {
        this.lastEvaluation.set(response);
        this.appendAuditLog(response);
      })
    );
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
}
