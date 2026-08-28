import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden selection:bg-cyan-500 selection:text-black">
      <!-- Background Cyber Glow Gradients -->
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/15 to-purple-600/15 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse"></div>
      <div class="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

      <!-- Brand Header -->
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <a routerLink="/" class="inline-flex items-center gap-3 group transition-transform hover:scale-105">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1.5px] shadow-[0_0_25px_rgba(6,182,212,0.4)]">
            <div class="w-full h-full bg-[#0B132B] rounded-[14px] flex items-center justify-center overflow-hidden">
              <img src="vigilai_logo.jpg" alt="VigilAI Logo" class="w-full h-full object-cover" />
            </div>
          </div>
          <div class="text-left">
            <span class="text-2xl font-extrabold tracking-tight text-white block leading-none">Vigil<span class="text-cyan-400">AI</span></span>
            <span class="text-[10px] tracking-widest uppercase font-mono text-cyan-400/80 mt-1 block">Autonomous Defense</span>
          </div>
        </a>
        <h2 class="mt-8 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Account Password Recovery
        </h2>
        <p class="mt-2 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          Enter your registered merchant work email to generate single-use cryptographic recovery credentials.
        </p>
      </div>

      <!-- Recovery Card -->
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-[#0B132B]/85 border border-slate-800/90 hover:border-cyan-500/40 py-8 px-6 sm:px-10 shadow-[0_0_50px_rgba(0,0,0,0.6)] rounded-3xl backdrop-blur-2xl transition-all relative overflow-hidden">
          
          <!-- Error Alert Banner -->
          <div *ngIf="errorMessage()" class="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-fade-in">
            <svg class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="leading-relaxed">{{ errorMessage() }}</div>
          </div>

          <!-- Success State -->
          <div *ngIf="isSubmitted(); else formState" class="text-center space-y-5 animate-fade-in">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.25)]">
              <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div>
              <h3 class="text-lg font-bold text-white tracking-tight">Recovery Token Generated</h3>
              <p class="text-xs text-slate-300 mt-1.5 leading-relaxed">
                A single-use recovery token has been initialized for <span class="text-cyan-300 font-mono font-semibold">{{ email }}</span>.
              </p>
            </div>

            <!-- Direct Reset Action Button (Frictionless Reset) -->
            <div *ngIf="resetToken()" class="p-4 rounded-2xl bg-[#030712]/90 border border-cyan-500/30 text-left space-y-3 shadow-inner">
              <div class="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span class="text-cyan-400 font-semibold flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  Single-Use Recovery Key:
                </span>
                <span class="text-slate-500">TTL 15m</span>
              </div>
              <div class="font-mono text-xs text-slate-200 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 break-all select-all flex items-center justify-between gap-2">
                <span class="truncate">{{ resetToken() }}</span>
                <button (click)="copyToken()" type="button" class="shrink-0 text-[10px] px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded border border-cyan-500/40 transition-colors">
                  {{ isCopied() ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <button
                (click)="goToReset()"
                type="button"
                class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Reset Password Now →</span>
              </button>
            </div>

            <div class="pt-2 border-t border-slate-800/80">
              <a
                routerLink="/login"
                class="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 font-medium transition-colors"
              >
                <span>← Back to Sign In</span>
              </a>
            </div>
          </div>

          <!-- Input Form State -->
          <ng-template #formState>
            <form (ngSubmit)="onSubmit()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Registered Work Email</label>
                <div class="relative">
                  <input
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    required
                    placeholder="je0744@srmist.edu.in"
                    class="w-full bg-[#030712]/90 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all font-sans shadow-inner"
                  />
                </div>
              </div>

              <div class="pt-2">
                <button
                  type="submit"
                  [disabled]="isLoading() || !email"
                  class="w-full relative group overflow-hidden rounded-xl p-[1px] font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)]"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 group-hover:from-cyan-400 group-hover:to-blue-500 transition-all"></div>
                  <div class="relative px-4 py-3 rounded-xl bg-transparent flex items-center justify-center gap-2 text-black font-extrabold tracking-wide">
                    <span *ngIf="!isLoading()" class="flex items-center gap-2">
                      <span>Generate Recovery Token</span>
                      <span class="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                    <span *ngIf="isLoading()" class="flex items-center gap-2">
                      <span class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      <span>Issuing Token...</span>
                    </span>
                  </div>
                </button>
              </div>

              <div class="text-center pt-2 border-t border-slate-800/80">
                <a routerLink="/login" class="text-xs text-slate-400 hover:text-cyan-400 font-medium transition-colors">
                  Remember password? Return to Sign In
                </a>
              </div>
            </form>
          </ng-template>
        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  readonly isLoading = signal(false);
  readonly isSubmitted = signal(false);
  readonly resetToken = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isCopied = signal(false);

  onSubmit() {
    if (!this.email || !this.email.includes('@')) {
      this.errorMessage.set('Please enter a valid work email address.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.isSubmitted.set(true);
        if (res.reset_token) {
          this.resetToken.set(res.reset_token);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.detail?.message || err?.error?.message || 'Failed to dispatch recovery request. Please try again.';
        this.errorMessage.set(msg);
      },
    });
  }

  copyToken() {
    const token = this.resetToken();
    if (token) {
      navigator.clipboard.writeText(token);
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    }
  }

  goToReset() {
    const token = this.resetToken();
    if (token) {
      this.router.navigate(['/reset-password'], { queryParams: { token } });
    } else {
      this.router.navigate(['/reset-password']);
    }
  }
}

