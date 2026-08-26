import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { CyberBackgroundComponent } from '../../shared/components/cyber-background.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CyberBackgroundComponent],
  template: `
    <div class="min-h-screen text-slate-100 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-cyan-500 selection:text-black relative overflow-hidden">
      <!-- Dynamic 3D Cyber Animated Video & Neural Particle Canvas -->
      <app-cyber-background></app-cyber-background>

      <!-- Top Header Brand Emblem -->
      <div class="relative z-20 text-center mb-8">
        <a routerLink="/" class="inline-flex items-center gap-3 group">
          <div class="relative">
            <img src="vigilai_logo.jpg" alt="VigilAI Logo" class="w-12 h-12 rounded-2xl shadow-xl shadow-cyan-500/30 object-cover border border-cyan-500/50 group-hover:scale-105 transition-all" />
            <span class="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 border-2 border-[#030712]"></span>
            </span>
          </div>
          <div class="text-left">
            <div class="flex items-center gap-2">
              <span class="text-2xl font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors">VigilAI</span>
              <span class="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/40 font-bold">PRO</span>
            </div>
            <p class="text-[10px] text-slate-400 font-mono">Autonomous Fraud Defense</p>
          </div>
        </a>
      </div>

      <!-- Two-Column Container -->
      <div class="relative z-20 w-full max-w-5xl">
        <!-- Sign Up Initial Form State -->
        <div *ngIf="!createdApiKey(); else apiKeySuccessState" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <!-- Left Column: Trust & Value Proposition -->
          <div class="lg:col-span-5 space-y-8 pr-0 lg:pr-4">
            <div>
              <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Join thousands of merchants protecting their business
              </h2>
            </div>

            <div class="space-y-6">
              <!-- Feature 1 -->
              <div class="flex items-start gap-4">
                <div class="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-md">
                  <svg class="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white">Real-time fraud detection</h4>
                  <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">AI-powered sub-millisecond risk assessment.</p>
                </div>
              </div>

              <!-- Feature 2 -->
              <div class="flex items-start gap-4">
                <div class="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/40 text-blue-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.2)] backdrop-blur-md">
                  <svg class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white">Advanced entity intelligence</h4>
                  <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">Graph-based relationship and collusion analysis.</p>
                </div>
              </div>

              <!-- Feature 3 -->
              <div class="flex items-start gap-4">
                <div class="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.2)] backdrop-blur-md">
                  <svg class="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white">Enterprise-grade security</h4>
                  <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">HMAC authentication, tenant isolation & audit logs.</p>
                </div>
              </div>

              <!-- Feature 4 -->
              <div class="flex items-start gap-4">
                <div class="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.2)] backdrop-blur-md">
                  <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white">Seamless integration</h4>
                  <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">REST API & webhook support ready in under 5 minutes.</p>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-800/80">
              <p class="text-xs text-slate-400 font-mono">Trusted by leading fintech & retail companies worldwide</p>
            </div>
          </div>

          <!-- Right Column: Registration Card -->
          <div class="lg:col-span-7">
            <div class="bg-[#0B132B]/80 border border-slate-800/90 hover:border-cyan-500/30 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden transition-all">
              <div class="mb-6">
                <h3 class="text-2xl font-extrabold text-white tracking-tight">Create Merchant Account</h3>
                <p class="text-xs text-slate-400 mt-1">Get started in minutes</p>
              </div>

              <!-- Error Alert Banner -->
              <div *ngIf="errorMessage()" class="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-fade-in">
                <svg class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div class="leading-relaxed">{{ errorMessage() }}</div>
              </div>

              <form (ngSubmit)="onSignup()" class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    [(ngModel)]="fullName"
                    name="fullName"
                    required
                    placeholder="Eshwar J"
                    class="w-full bg-[#030712]/90 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all font-sans shadow-inner"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
                  <input
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    required
                    placeholder="eshwar@enterprise.com"
                    class="w-full bg-[#030712]/90 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all font-sans shadow-inner"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">Company / Merchant Name</label>
                  <input
                    type="text"
                    [(ngModel)]="companyName"
                    name="companyName"
                    required
                    placeholder="Acme Payments"
                    class="w-full bg-[#030712]/90 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all font-sans shadow-inner"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">Password (min 8 chars)</label>
                  <div class="relative">
                    <input
                      [type]="showPassword() ? 'text' : 'password'"
                      [(ngModel)]="password"
                      name="password"
                      required
                      minlength="8"
                      placeholder="••••••••••••"
                      class="w-full bg-[#030712]/90 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all font-sans pr-10 shadow-inner"
                    />
                    <button
                      type="button"
                      (click)="showPassword.set(!showPassword())"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Toggle password visibility"
                    >
                      <svg *ngIf="!showPassword()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <svg *ngIf="showPassword()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Submit Button (Gradient Cyan to Purple) -->
                <div class="pt-3">
                  <button
                    type="submit"
                    [disabled]="isLoading()"
                    class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 text-black font-extrabold text-xs shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span *ngIf="!isLoading()">Register & Generate API Key →</span>
                    <span *ngIf="isLoading()" class="flex items-center gap-2 text-black">
                      <span class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      <span>Provisioning Merchant Tenant...</span>
                    </span>
                  </button>
                </div>

                <!-- Terms & Privacy Agreement Notice -->
                <div class="mt-3 text-center text-[11px] text-slate-400 leading-relaxed">
                  By creating an account, you agree to our 
                  <a routerLink="/terms" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">Terms of Service</a> 
                  and 
                  <a routerLink="/privacy" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">Privacy Policy</a>.
                </div>
              </form>

              <!-- Sign In Link -->
              <div class="mt-5 text-center text-xs text-slate-400">
                <span>Already have an account? </span>
                <a routerLink="/login" class="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                  Sign in
                </a>
              </div>

              <!-- Footer Backend API Target Bar -->
              <div class="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div class="flex items-center gap-1.5">
                  <span>Target Backend API</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Connected
                  </span>
                </div>
                <button
                  type="button"
                  (click)="showApiConfig.set(!showApiConfig())"
                  class="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Configure →
                </button>
              </div>

              <!-- Hidden Config Input when clicked -->
              <div *ngIf="showApiConfig()" class="mt-3 pt-3 border-t border-slate-800/40 space-y-2 animate-fade-in">
                <input
                  type="text"
                  [(ngModel)]="customApiUrl"
                  placeholder="https://vigil-ai-f0ev.onrender.com"
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
                  <span class="text-slate-500 font-mono truncate max-w-[200px]">{{ currentBaseUrl }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Success API Key Presentation State -->
        <ng-template #apiKeySuccessState>
          <div class="max-w-xl mx-auto bg-[#0B132B]/80 border border-emerald-500/40 py-8 px-6 sm:px-10 shadow-[0_0_50px_rgba(0,0,0,0.6)] rounded-3xl space-y-6 animate-fade-in backdrop-blur-2xl">
            <div class="text-center space-y-2">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white tracking-tight">Merchant Tenant Provisioned</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Your live account is provisioned in Cloud MySQL. Save your secret API Key securely.
              </p>
            </div>

            <!-- API Key Display Box -->
            <div class="p-4 rounded-2xl bg-[#030712] border border-slate-800 space-y-2">
              <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                <span>Primary Production API Key</span>
                <span class="text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <div class="flex items-center gap-2">
                <code class="text-xs text-cyan-300 font-mono bg-slate-900 px-3 py-2.5 rounded-xl flex-1 overflow-x-auto select-all border border-slate-800">
                  {{ createdApiKey() }}
                </code>
                <button
                  type="button"
                  (click)="copyApiKey()"
                  class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
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
                class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 text-black font-extrabold text-xs shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
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
  showPassword = signal(false);
  customApiUrl = '';

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly createdApiKey = signal<string | null>(null);
  readonly isCopied = signal(false);
  readonly showApiConfig = signal(false);

  get currentBaseUrl(): string {
    return this.api.baseUrl || 'https://vigil-ai-f0ev.onrender.com';
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
