import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Shield, Lock, Mail, ArrowRight, AlertTriangle, Play, Server, Settings } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
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
          Sign in to Merchant Risk Console
        </h2>
        <p class="mt-2 text-xs text-slate-400">
          Or <a routerLink="/signup" class="font-semibold text-cyan-400 hover:text-cyan-300">create a new merchant account</a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div class="bg-[#0B132B]/90 border border-slate-800 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl backdrop-blur-xl">
          <!-- Error Alert -->
          <div *ngIf="errorMessage()" class="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <lucide-icon name="alert-triangle" [size]="16" class="text-rose-400 shrink-0 mt-0.5"></lucide-icon>
            <div class="leading-relaxed">{{ errorMessage() }}</div>
          </div>

          <form (ngSubmit)="onLogin()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <div class="relative">
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  placeholder="admin@enterprise.com"
                  class="w-full bg-[#030712] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-slate-300">Password</label>
                <a routerLink="/forgot-password" class="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors">Forgot password?</a>
              </div>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
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
                <span *ngIf="!isLoading()">Sign In →</span>
                <span *ngIf="isLoading()" class="flex items-center gap-2">
                  <span class="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying Credentials...</span>
                </span>
              </button>
            </div>
          </form>

          <!-- Quick Switcher to Historical Demo -->
          <div class="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <a
              routerLink="/demo"
              class="inline-flex items-center gap-2 text-xs text-amber-300 hover:text-amber-200 font-semibold transition-colors"
            >
              <lucide-icon name="play" [size]="12" class="text-amber-400"></lucide-icon>
              <span>Explore 6.9k Historical Benchmark Demo</span>
            </a>
          </div>

          <!-- Backend API URL Config Accordion -->
          <div class="mt-4 pt-4 border-t border-slate-800/60">
            <button
              type="button"
              (click)="showApiConfig.set(!showApiConfig())"
              class="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-300 transition-colors font-mono"
            >
              <span class="flex items-center gap-1.5">
                <lucide-icon name="server" [size]="12"></lucide-icon>
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
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  email = '';
  password = '';
  customApiUrl = '';

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showApiConfig = signal(false);

  get currentBaseUrl(): string {
    return this.api.baseUrl || 'https://vigilai-api.onrender.com';
  }

  ngOnInit() {
    this.customApiUrl = this.currentBaseUrl;
    const errorParam = this.route.snapshot.queryParamMap.get('error');
    if (errorParam === 'session_expired') {
      this.errorMessage.set('Your session has expired. Please sign in again.');
    }
  }

  saveCustomApiUrl() {
    if (this.customApiUrl) {
      this.api.setApiUrl(this.customApiUrl);
      this.errorMessage.set(null);
      this.showApiConfig.set(false);
    }
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please enter your email and password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.login({
      email: this.email,
      password: this.password,
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/app/overview';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Invalid email or password provided.');
      },
    });
  }
}
