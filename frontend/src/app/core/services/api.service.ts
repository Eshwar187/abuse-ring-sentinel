import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);

  get baseUrl(): string {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sentinel_api_url');
      if (stored && stored.trim()) return stored.trim().replace(/\/+$/, '');
      const win = window as any;
      if (win.__API_BASE_URL__) return win.__API_BASE_URL__.trim().replace(/\/+$/, '');
    }
    return environment.apiBaseUrl || '';
  }

  setApiUrl(url: string): void {
    if (typeof window !== 'undefined') {
      if (url && url.trim()) {
        localStorage.setItem('sentinel_api_url', url.trim().replace(/\/+$/, ''));
      } else {
        localStorage.removeItem('sentinel_api_url');
      }
    }
  }

  get<T>(endpoint: string, options?: { headers?: Record<string, string> }): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, options).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  post<T>(endpoint: string, body: any, options?: { headers?: Record<string, string> }): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, options).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  put<T>(endpoint: string, body: any, options?: { headers?: Record<string, string> }): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, options).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  delete<T>(endpoint: string, options?: { headers?: Record<string, string> }): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, options).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown network error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      if (error.status === 405) {
        errorMessage = 'API Endpoint returned 405 Method Not Allowed. The frontend on Vercel is trying to reach an API route that requires the Render backend. Please verify your Render Backend URL in the Endpoint settings below.';
      } else if (error.status === 0) {
        errorMessage = 'Risk API backend service is unreachable. Please check that your Render service is active (it may take ~30s to wake up on free tier).';
      } else if (error.error?.detail) {
        errorMessage = typeof error.error.detail === 'string' ? error.error.detail : JSON.stringify(error.error.detail);
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Server Error [HTTP ${error.status}]: ${error.statusText || 'Request failed'}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
