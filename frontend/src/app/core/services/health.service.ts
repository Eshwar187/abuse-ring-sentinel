import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { HealthResponse, MetricsSummary } from '../models/risk.models';
import { catchError, of, tap, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HealthService {
  private api = inject(ApiService);

  readonly healthState = signal<{
    isOnline: boolean;
    data: HealthResponse | null;
    lastChecked: Date | null;
    error: string | null;
  }>({
    isOnline: false,
    data: null,
    lastChecked: null,
    error: null,
  });

  readonly metricsState = signal<{
    data: MetricsSummary | null;
    lastUpdated: Date | null;
    isLoading: boolean;
    error: string | null;
  }>({
    data: null,
    lastUpdated: null,
    isLoading: false,
    error: null,
  });

  checkHealth(): Observable<HealthResponse | null> {
    return this.api.get<HealthResponse>('/health').pipe(
      tap((data) => {
        this.healthState.set({
          isOnline: true,
          data,
          lastChecked: new Date(),
          error: null,
        });
      }),
      catchError((err) => {
        this.healthState.set({
          isOnline: false,
          data: null,
          lastChecked: new Date(),
          error: err.message,
        });
        return of(null);
      })
    );
  }

  fetchMetrics(): Observable<MetricsSummary | null> {
    this.metricsState.update((s) => ({ ...s, isLoading: true }));
    return this.api.get<MetricsSummary>('/metrics/summary').pipe(
      tap((data) => {
        this.metricsState.set({
          data,
          lastUpdated: new Date(),
          isLoading: false,
          error: null,
        });
      }),
      catchError((err) => {
        this.metricsState.set({
          data: null,
          lastUpdated: new Date(),
          isLoading: false,
          error: err.message,
        });
        return of(null);
      })
    );
  }
}
