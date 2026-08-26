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
      if (error.status === 0) {
        errorMessage = 'Risk API service is currently unreachable. Please ensure the backend server is running and CORS is permitted.';
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
