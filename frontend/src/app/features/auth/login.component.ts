import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { CyberBackgroundComponent } from '../../shared/components/cyber-background.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CyberBackgroundComponent],
  template: `
    <div class="min-h-screen text-slate-100 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-cyan-500 selection:text-black relative overflow-hidden">
      <!-- Dynamic 3D Cyber Animated Video & Neural Particle Canvas -->
      <app-cyber-background></app-cyber-background>

      <!-- Left Holographic Decorative Shield (Visible on large screens) -->
      <div class="hidden lg:flex flex-col items-center justify-center absolute left-12 xl:left-24 top-1/2 -translate-y-1/2 pointer-events-none z-10 select-none animate-pulse-slow">
        <!-- Floating Wireframe Cube Top -->
        <div class="w-10 h-10 border border-cyan-500/40 rotate-45 rounded-lg mb-6 shadow-[0_0_20px_rgba(6,182,212,0.2)]"></div>
        
        <!-- 3D Glowing Shield Hologram -->
        <div class="relative w-44 h-52 flex items-center justify-center">
          <div class="absolute inset-0 bg-gradient-to-b from-cyan-500/20 via-purple-500/20 to-transparent rounded-3xl blur-xl"></div>
          <div class="relative w-40 h-48 border-2 border-cyan-400/60 rounded-3xl bg-[#080D1A]/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.3)]">
            <svg class="w-24 h-24 text-cyan-400 filter drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        <!-- Floating Wireframe Cube Bottom -->
        <div class="w-8 h-8 border border-purple-500/40 rotate-12 rounded-lg mt-6 shadow-[0_0_15px_rgba(168,85,247,0.2)]"></div>
      </div>

      <!-- Right Floating Holographic Cubes (Visible on large screens) -->
      <div class="hidden lg:flex flex-col items-center justify-center absolute right-12 xl:right-24 top-1/2 -translate-y-1/2 pointer-events-none z-10 select-none animate-pulse-slow">
        <div class="w-12 h-12 border border-blue-500/40 rotate-45 rounded-xl mb-8 shadow-[0_0_20px_rgba(59,130,246,0.2)]"></div>
        <div class="w-20 h-20 border-2 border-cyan-400/50 rotate-12 rounded-2xl bg-[#0B132B]/40 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.25)]">
          <div class="w-8 h-8 border border-purple-400/60 rotate-45 rounded-lg"></div>
        </div>
        <div class="w-10 h-10 border border-purple-500/40 -rotate-12 rounded-lg mt-8 shadow-[0_0_20px_rgba(168,85,247,0.2)]"></div>
      </div>

      <!-- Top Header Brand Emblem -->
      <div class="relative z-20 text-center mb-6">
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

      <!-- Main Login Floating Glassmorphic Container -->
      <div class="relative z-20 w-full max-w-md">
        <div class="bg-[#0B132B]/80 border border-slate-800/90 hover:border-cyan-500/30 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden transition-all">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h2>
            <p class="text-xs text-slate-400 mt-1">Sign in to your merchant risk console</p>
          </div>



          <!-- Error Alert Banner -->
          <div *ngIf="errorMessage()" class="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-fade-in">
            <svg class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="leading-relaxed font-sans">{{ errorMessage() }}</div>
          </div>

          <form (ngSubmit)="onLogin()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5 font-sans">Work Email</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                placeholder="admin@enterprise.com"
                class="w-full bg-[#030712]/90 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all font-sans shadow-inner"
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-slate-300 font-sans">Password</label>
                <a routerLink="/forgot-password" class="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors">Forgot password?</a>
              </div>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="••••••••••••"
                class="w-full bg-[#030712]/90 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all font-sans shadow-inner"
              />
            </div>

            <!-- Remember Me Checkbox -->
            <div class="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                [(ngModel)]="rememberMe"
                name="rememberMe"
                class="w-4 h-4 rounded bg-[#030712] border-slate-700 text-cyan-500 focus:ring-cyan-500/20 focus:ring-offset-0 focus:outline-none cursor-pointer"
              />
              <label for="rememberMe" class="text-xs text-slate-400 cursor-pointer select-none">Remember me</label>
            </div>

            <!-- Submit Button (Gradient Cyan to Purple) -->
            <div class="pt-3">
              <button
                type="submit"
                [disabled]="isLoading()"
                class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 text-black font-extrabold text-xs shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span *ngIf="!isLoading()">Sign In →</span>
                <span *ngIf="isLoading()" class="flex items-center gap-2 text-black">
                  <span class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Signing In...</span>
                </span>
              </button>
            </div>
          </form>

          <!-- New Merchant Link -->
          <div class="mt-6 text-center text-xs text-slate-400">
            <span>New to VigilAI? </span>
            <a routerLink="/signup" class="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer">
              Create your merchant account
            </a>
          </div>

          <!-- Benchmark Demo Link -->
          <div class="mt-4 pt-4 border-t border-slate-800/80 text-center space-y-2">
            <a
              routerLink="/demo"
              class="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              <span>▶</span>
              <span>Explore 6.9K Historical Benchmark Demo</span>
            </a>
            <div class="text-[10px] text-slate-500 font-mono">
              Protected by Enterprise Shield · 
              <a routerLink="/terms" target="_blank" class="text-slate-400 hover:text-cyan-300 underline transition-colors">Terms</a> · 
              <a routerLink="/privacy" target="_blank" class="text-slate-400 hover:text-cyan-300 underline transition-colors">Privacy</a>
            </div>
          </div>

          <!-- SuperAdmin Portal Access Section -->
          <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <div class="flex items-center gap-1.5 text-slate-400">
              <span>🔒 System Administration</span>
            </div>
            <a
              routerLink="/admin/login"
              class="px-3 py-1 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 hover:border-purple-400 text-purple-300 hover:text-white font-bold transition-all text-[11px]"
            >
              Admin Login →
            </a>
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
  rememberMe = true;
  customApiUrl = '';

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showApiConfig = signal(false);

  get currentBaseUrl(): string {
    return this.api.baseUrl || 'https://vigil-ai-f0ev.onrender.com';
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

  fillCredentials(email: string, pass: string) {
    this.email = email;
    this.password = pass;
    this.errorMessage.set(null);
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please enter your email and password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.login({
      email: this.email.trim().toLowerCase(),
      password: this.password,
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/app/overview';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        let msg = 'Invalid email or password provided.';
        if (err?.error?.message && typeof err.error.message === 'string') {
          msg = err.error.message;
        } else if (err?.error?.detail?.message && typeof err.error.detail.message === 'string') {
          msg = err.error.detail.message;
        } else if (err?.message && typeof err.message === 'string' && !err.message.startsWith('Http failure')) {
          msg = err.message;
        }
        this.errorMessage.set(msg);
      },
    });
  }
}
