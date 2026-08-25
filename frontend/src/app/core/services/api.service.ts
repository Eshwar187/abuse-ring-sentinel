import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  readonly baseUrl = environment.apiBaseUrl;

  get<T>(endpoint: string, options?: { headers?: Record<string, string> }): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, options).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, body: any, options?: { headers?: Record<string, string> }): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, options).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown network error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'Risk API service is currently unreachable. Please ensure FastAPI server is running on port 8000.';
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
