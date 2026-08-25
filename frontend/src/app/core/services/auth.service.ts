import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { ApiService } from './api.service';
import {
  UserSession,
  SignupRequestPayload,
  SignupResponsePayload,
  LoginRequestPayload,
  LoginResponsePayload,
  RotateKeyResponsePayload,
} from '../models/auth.models';

const SESSION_STORAGE_KEY = 'ars_session_token';
const USER_STORAGE_KEY = 'ars_user_session';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  readonly sessionToken = signal<string | null>(this.getStoredSessionToken());
  readonly currentUser = signal<UserSession | null>(this.getStoredUser());
  readonly isAuthenticated = computed(() => !!this.sessionToken());

  // Transiently holds raw API key when generated during signup or key rotation
  readonly rawApiKeyJustGenerated = signal<string | null>(null);

  constructor() {
    // If token exists on load, verify session with backend
    if (this.sessionToken()) {
      this.checkSession().subscribe({
        error: () => this.clearSession(),
      });
    }
  }

  signup(payload: SignupRequestPayload): Observable<SignupResponsePayload> {
    return this.api.post<SignupResponsePayload>('/api/v1/auth/signup', payload).pipe(
      tap((res) => {
        this.saveSession(res.session_token, {
          user_id: res.user_id,
          merchant_id: res.merchant_id,
          full_name: res.full_name,
          email: res.email,
          company_name: res.company_name,
          api_key_masked: res.api_key.slice(0, 12) + '...',
        });
        this.rawApiKeyJustGenerated.set(res.api_key);
      })
    );
  }

  login(payload: LoginRequestPayload): Observable<LoginResponsePayload> {
    return this.api.post<LoginResponsePayload>('/api/v1/auth/login', payload).pipe(
      tap((res) => {
        this.saveSession(res.session_token, {
          user_id: res.user_id,
          merchant_id: res.merchant_id,
          full_name: res.full_name,
          email: res.email,
          company_name: res.company_name,
          api_key_masked: res.api_key_masked,
        });
      })
    );
  }

  checkSession(): Observable<UserSession> {
    const token = this.sessionToken();
    if (!token) {
      return throwError(() => new Error('No active session token'));
    }
    return this.api.get<UserSession>('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }).pipe(
      tap((user) => {
        this.currentUser.set(user);
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } catch {}
      })
    );
  }

  rotateApiKey(): Observable<RotateKeyResponsePayload> {
    const token = this.sessionToken();
    return this.api.post<RotateKeyResponsePayload>('/api/v1/auth/rotate-key', {}, {
      headers: { Authorization: `Bearer ${token}` },
    }).pipe(
      tap((res) => {
        this.rawApiKeyJustGenerated.set(res.new_api_key);
        const cur = this.currentUser();
        if (cur) {
          this.currentUser.set({
            ...cur,
            api_key_masked: res.key_prefix,
          });
        }
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.sessionToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private saveSession(token: string, user: UserSession): void {
    this.sessionToken.set(token);
    this.currentUser.set(user);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {}
  }

  private clearSession(): void {
    this.sessionToken.set(null);
    this.currentUser.set(null);
    this.rawApiKeyJustGenerated.set(null);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  }

  private getStoredSessionToken(): string | null {
    try {
      return localStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): UserSession | null {
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
