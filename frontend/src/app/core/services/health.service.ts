import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { HealthResponse } from '../models/risk.models';
import { catchError, of, tap } from 'rxjs';

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

  checkHealth() {
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
}
