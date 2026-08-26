import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-cyan-500 selection:text-black">
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <a routerLink="/" class="inline-flex items-center gap-3">
          <img src="vigilai_logo.jpg" alt="VigilAI Logo" class="w-12 h-12 rounded-2xl shadow-xl shadow-cyan-500/25 object-cover border border-cyan-500/40" />
          <div class="text-left">
            <span class="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>VigilAI</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">PRO</span>
            </span>
            <p class="text-[10px] text-slate-400 font-mono">Autonomous Fraud Defense</p>
          </div>
        </a>
        <h2 class="mt-6 text-2xl font-bold tracking-tight text-white">
          Create Merchant Account
        </h2>
        <p class="mt-2 text-xs text-slate-400">
          Already have an account? <a routerLink="/login" class="font-semibold text-cyan-400 hover:text-cyan-300">Sign in</a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <!-- Sign Up Form State -->
        <div *ngIf="!createdApiKey(); else apiKeySuccessState" class="bg-[#0B132B]/90 border border-slate-800 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl backdrop-blur-xl">
          <!-- Error Alert -->
          <div *ngIf="errorMessage()" class="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <svg class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="leading-relaxed">{{ errorMessage() }}</div>
          </div>

          <form (ngSubmit)="onSignup()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                [(ngModel)]="fullName"
                name="fullName"
                required
                placeholder="Eshwar J"
                class="w-full bg-[#030712] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all font-sans"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                placeholder="eshwar@enterprise.com"
                class="w-full bg-[#030712] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all font-sans"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Company / Merchant Name</label>
              <input
                type="text"
                [(ngModel)]="companyName"
                name="companyName"
                required
                placeholder="Acme Payments"
                class="w-full bg-[#030712] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all font-sans"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Password (min 8 chars)</label>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                minlength="8"
                placeholder="••••••••••••"
                class="w-full bg-[#030712] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all font-sans"
              />
            </div>

            <div class="pt-2">
              <button
                type="submit"
                [disabled]="isLoading()"
                class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
              >
                <span *ngIf="!isLoading()">Register & Generate API Key →</span>
                <span *ngIf="isLoading()" class="flex items-center gap-2">
                  <span class="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Provisioning Tenant...</span>
                </span>
              </button>
            </div>
          </form>

          <!-- Backend API URL Config Accordion -->
          <div class="mt-6 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              (click)="showApiConfig.set(!showApiConfig())"
              class="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-300 transition-colors font-mono"
            >
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                <span>Target Backend API</span>
              </span>
              <span>{{ showApiConfig() ? '▲ Hide' : '▼ Configure' }}</span>
            </button>

            <div *ngIf="showApiConfig()" class="mt-3 space-y-2 animate-fade-in">
              <input
                type="text"
                [(ngModel)]="customApiUrl"
                placeholder="https://vigilai-api.onrender.com"
                class="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
              />
              <div class="flex items-center justify-between text-[10px]">
                <button
                  type="button"
                  (click)="saveCustomApiUrl()"
                  class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono transition-colors"
                >
                  Save Endpoint
                </button>
                <span class="text-slate-500 font-mono">Current: {{ currentBaseUrl }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Success API Key Presentation State -->
        <ng-template #apiKeySuccessState>
          <div class="bg-[#0B132B]/90 border border-emerald-500/40 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl space-y-6 animate-fade-in backdrop-blur-xl">
            <div class="text-center space-y-2">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-white tracking-tight">Merchant Tenant Provisioned</h3>
              <p class="text-xs text-slate-400">
                Your live account is created. Save your secret API Key securely — it will not be shown in plain text again.
              </p>
            </div>

            <!-- API Key Display Box -->
            <div class="p-4 rounded-xl bg-[#030712] border border-slate-800 space-y-2">
              <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                <span>Primary Production API Key</span>
                <span class="text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <div class="flex items-center gap-2">
                <code class="text-xs text-cyan-300 font-mono bg-slate-900 px-3 py-2 rounded-lg flex-1 overflow-x-auto select-all border border-slate-800">
                  {{ createdApiKey() }}
                </code>
                <button
                  type="button"
                  (click)="copyApiKey()"
                  class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  title="Copy API Key"
                >
                  <svg *ngIf="!isCopied()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2v-6a2 2 0 00-2-2z" />
                  </svg>
                  <svg *ngIf="isCopied()" class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="pt-2">
              <button
                type="button"
                (click)="continueToOnboarding()"
                class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Dashboard & Gateway Setup →</span>
              </button>
            </div>
          </div>
        </ng-template>
      </div>
    </div>
  `,
})
export class SignupComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private api = inject(ApiService);

  fullName = '';
  email = '';
  companyName = '';
  password = '';
  customApiUrl = '';

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly createdApiKey = signal<string | null>(null);
  readonly isCopied = signal(false);
  readonly showApiConfig = signal(false);

  get currentBaseUrl(): string {
    return this.api.baseUrl || 'https://vigilai-api.onrender.com';
  }

  ngOnInit() {
    this.customApiUrl = this.currentBaseUrl;
  }

  saveCustomApiUrl() {
    if (this.customApiUrl) {
      this.api.setApiUrl(this.customApiUrl);
      this.errorMessage.set(null);
      this.showApiConfig.set(false);
    }
  }

  onSignup() {
    if (!this.fullName || !this.email || !this.companyName || !this.password) {
      this.errorMessage.set('All fields are required.');
      return;
    }
    if (this.password.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters long.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.signup({
      full_name: this.fullName,
      email: this.email,
      company_name: this.companyName,
      password: this.password,
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.createdApiKey.set(res.api_key);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Failed to create merchant account.');
      },
    });
  }

  copyApiKey() {
    const key = this.createdApiKey();
    if (key) {
      navigator.clipboard.writeText(key);
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    }
  }

  continueToOnboarding() {
    this.router.navigate(['/onboarding']);
  }
}
