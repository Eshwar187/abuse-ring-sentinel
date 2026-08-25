import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { LiveMerchantMetrics } from '../models/auth.models';
import {
  RawTransactionEvent,
  RiskEvaluateResponse,
  TransactionListItem,
} from '../models/risk.models';

export interface PaginatedTransactionsResponse {
  merchant_id: string;
  total_count: number;
  page: number;
  page_size: number;
  transactions: TransactionListItem[];
  zero_data_state: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MerchantService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  readonly liveMetrics = signal<LiveMerchantMetrics | null>(null);
  readonly liveTransactions = signal<TransactionListItem[]>([]);
  readonly totalTransactionCount = signal<number>(0);
  readonly isZeroData = signal<boolean>(true);
  readonly lastUpdatedTimestamp = signal<Date>(new Date());
  readonly secondsSinceLastUpdate = signal<number>(0);
  readonly isRefreshing = signal<boolean>(false);

  private timerInterval: any = null;

  constructor() {
    this.startUpdateTimer();
  }

  getLiveMetrics(): Observable<LiveMerchantMetrics> {
    this.isRefreshing.set(true);
    return this.api.get<LiveMerchantMetrics>('/api/v1/merchant/metrics', {
      headers: this.auth.getAuthHeaders(),
    }).pipe(
      tap((metrics) => {
        this.liveMetrics.set(metrics);
        this.isZeroData.set(metrics.zero_data_state);
        this.lastUpdatedTimestamp.set(new Date());
        this.secondsSinceLastUpdate.set(0);
        this.isRefreshing.set(false);
      }),
      catchError((err) => {
        this.isRefreshing.set(false);
        throw err;
      })
    );
  }

  getLiveTransactions(
    search?: string,
    riskLevel?: string,
    decision?: string,
    page: number = 1,
    pageSize: number = 50
  ): Observable<PaginatedTransactionsResponse> {
    let query = `/api/v1/merchant/transactions?page=${page}&page_size=${pageSize}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (riskLevel) query += `&risk_level=${encodeURIComponent(riskLevel)}`;
    if (decision) query += `&decision=${encodeURIComponent(decision)}`;

    return this.api.get<PaginatedTransactionsResponse>(query, {
      headers: this.auth.getAuthHeaders(),
    }).pipe(
      tap((res) => {
        this.liveTransactions.set(res.transactions);
        this.totalTransactionCount.set(res.total_count);
        this.isZeroData.set(res.zero_data_state);
        this.lastUpdatedTimestamp.set(new Date());
        this.secondsSinceLastUpdate.set(0);
      })
    );
  }

  getLiveEntityGraph(): Observable<any> {
    return this.api.get<any>('/api/v1/merchant/graph', {
      headers: this.auth.getAuthHeaders(),
    });
  }

  evaluateLiveTransaction(payload: RawTransactionEvent): Observable<RiskEvaluateResponse> {
    return this.api.post<RiskEvaluateResponse>('/api/v1/risk/evaluate', payload, {
      headers: this.auth.getAuthHeaders(),
    }).pipe(
      tap(() => {
        // Automatically refresh metrics and transaction list after an evaluation
        this.getLiveMetrics().subscribe();
      })
    );
  }

  getTransactionDetail(transactionId: string): Observable<any> {
    return this.api.get<any>(`/api/v1/risk/${transactionId}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getIntegrationConfig(): Observable<any> {
    return this.api.get<any>('/api/v1/merchant/integration', {
      headers: this.auth.getAuthHeaders(),
    });
  }

  updateIntegrationConfig(cfg: any): Observable<any> {
    return this.api.put<any>('/api/v1/merchant/integration', cfg, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  testActionEndpoint(payload?: any): Observable<any> {
    return this.api.post<any>('/api/v1/merchant/action-endpoint/test', payload || {}, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getActionByTx(transactionId: string): Observable<any> {
    return this.api.get<any>(`/api/v1/actions/${transactionId}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  retryAction(transactionId: string): Observable<any> {
    return this.api.post<any>(`/api/v1/actions/${transactionId}/retry`, {}, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getDatabaseSummary(): Observable<any> {
    return this.api.get<any>('/api/v1/admin/database/summary');
  }

  getMerchantHealth(): Observable<any> {
    return this.api.get<any>('/api/v1/merchant/health', {
      headers: this.auth.getAuthHeaders(),
    });
  }

  private startUpdateTimer() {
    if (typeof window !== 'undefined') {
      this.timerInterval = setInterval(() => {
        const last = this.lastUpdatedTimestamp();
        const diff = Math.floor((Date.now() - last.getTime()) / 1000);
        this.secondsSinceLastUpdate.set(diff);
      }, 1000);
    }
  }
}
