import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden selection:bg-cyan-500 selection:text-black">
      <!-- Ambient Cyber Glows -->
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/15 to-purple-600/15 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse"></div>
      <div class="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

      <!-- Header -->
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
          Set New Password
        </h2>
        <p class="mt-2 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          Create a strong, new password for your VigilAI merchant workspace.
        </p>
      </div>

      <!-- Reset Password Card -->
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-[#0B132B]/85 border border-slate-800/90 hover:border-cyan-500/40 py-8 px-6 sm:px-10 shadow-[0_0_50px_rgba(0,0,0,0.6)] rounded-3xl backdrop-blur-2xl transition-all relative overflow-hidden">
          
          <!-- Token Verified Badge -->
          <div *ngIf="verifiedEmail()" class="mb-5 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 flex items-center justify-between shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Account: <strong class="text-white font-mono">{{ verifiedEmail() }}</strong></span>
            </div>
            <span *ngIf="verifiedCompany()" class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">{{ verifiedCompany() }}</span>
          </div>

          <!-- Error Alert Banner -->
          <div *ngIf="errorMessage()" class="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-fade-in">
            <svg class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="leading-relaxed flex-1">{{ errorMessage() }}</div>
          </div>

          <!-- Success State -->
          <div *ngIf="isSuccess(); else formState" class="text-center space-y-5 animate-fade-in">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.25)]">
              <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white tracking-tight">Password Successfully Reset</h3>
              <p class="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Your password has been updated in the cloud database. You can now sign in with your new credentials.
              </p>
            </div>

            <div class="pt-2">
              <a
                routerLink="/login"
                class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Sign In →</span>
              </a>
            </div>
          </div>

          <!-- Form State -->
          <ng-template #formState>
            <form (ngSubmit)="onSubmit()" class="space-y-4">
              <!-- Token field (if not in URL) -->
              <div *ngIf="!hasUrlToken">
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Recovery Token</label>
                <input
                  type="text"
                  [(ngModel)]="token"
                  (ngModelChange)="onTokenChange()"
                  name="token"
                  required
                  placeholder="Paste your 32-character recovery token"
                  class="w-full bg-[#030712]/90 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all font-mono shadow-inner"
                />
              </div>

              <!-- New Password -->
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
                <div class="relative">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="newPassword"
                    name="newPassword"
                    required
                    minlength="8"
                    placeholder="At least 8 characters"
                    class="w-full bg-[#030712]/90 border border-slate-800 hover:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all font-sans shadow-inner"
                  />
                  <button
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <span class="text-[11px] font-mono uppercase">{{ showPassword() ? 'Hide' : 'Show' }}</span>
                  </button>
                </div>
              </div>

              <!-- Confirm Password -->
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
                <div class="relative">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="confirmPassword"
                    name="confirmPassword"
                    required
                    minlength="8"
                    placeholder="Re-enter your new password"
                    class="w-full bg-[#030712]/90 border border-slate-800 hover:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all font-sans shadow-inner"
                  />
                </div>
              </div>

              <!-- Real-time Validation Hints -->
              <div class="p-3 rounded-xl bg-[#030712]/60 border border-slate-800/80 text-[11px] space-y-1.5">
                <div class="flex items-center gap-2" [class.text-emerald-400]="newPassword.length >= 8" [class.text-slate-500]="newPassword.length < 8">
                  <span>{{ newPassword.length >= 8 ? '✓' : '○' }}</span>
                  <span>Minimum 8 characters ({{ newPassword.length }}/8)</span>
                </div>
                <div class="flex items-center gap-2" [class.text-emerald-400]="confirmPassword && newPassword === confirmPassword" [class.text-slate-500]="!confirmPassword || newPassword !== confirmPassword">
                  <span>{{ confirmPassword && newPassword === confirmPassword ? '✓' : '○' }}</span>
                  <span>Passwords match</span>
                </div>
              </div>

              <div class="pt-2">
                <button
                  type="submit"
                  [disabled]="isLoading() || !canSubmit"
                  class="w-full relative group overflow-hidden rounded-xl p-[1px] font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)]"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 group-hover:from-cyan-400 group-hover:to-blue-500 transition-all"></div>
                  <div class="relative px-4 py-3 rounded-xl bg-transparent flex items-center justify-center gap-2 text-black font-extrabold tracking-wide">
                    <span *ngIf="!isLoading()" class="flex items-center gap-2">
                      <span>Update Password & Sign In</span>
                      <span class="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                    <span *ngIf="isLoading()" class="flex items-center gap-2">
                      <span class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      <span>Securing New Password...</span>
                    </span>
                  </div>
                </button>
              </div>

              <div class="text-center pt-2 border-t border-slate-800/80">
                <a routerLink="/forgot-password" class="text-xs text-slate-400 hover:text-cyan-400 font-medium transition-colors">
                  Need a new reset token?
                </a>
              </div>
            </form>
          </ng-template>
        </div>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = '';
  newPassword = '';
  confirmPassword = '';
  hasUrlToken = false;

  readonly showPassword = signal(false);
  readonly isLoading = signal(false);
  readonly isSuccess = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly verifiedEmail = signal<string | null>(null);
  readonly verifiedCompany = signal<string | null>(null);

  get canSubmit(): boolean {
    return (
      !!this.token &&
      this.newPassword.length >= 8 &&
      this.newPassword === this.confirmPassword
    );
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const qToken = params['token'];
      if (qToken) {
        this.token = qToken;
        this.hasUrlToken = true;
        this.verifyToken(qToken);
      }
    });
  }

  onTokenChange() {
    if (this.token && this.token.length >= 20) {
      this.verifyToken(this.token);
    }
  }

  verifyToken(tok: string) {
    this.auth.verifyResetToken(tok).subscribe({
      next: (res) => {
        if (res.valid) {
          this.verifiedEmail.set(res.email || null);
          this.verifiedCompany.set(res.company_name || null);
          this.errorMessage.set(null);
        }
      },
      error: (err) => {
        const msg = err?.error?.detail?.message || err?.error?.message || 'Invalid or expired recovery token. Please request a new link.';
        this.errorMessage.set(msg);
      },
    });
  }

  onSubmit() {
    if (!this.token) {
      this.errorMessage.set('Recovery token is required.');
      return;
    }
    if (this.newPassword.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters long.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.resetPassword({
      token: this.token.trim(),
      new_password: this.newPassword,
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.detail?.message || err?.error?.message || 'Failed to reset password. The token may be expired or already used.';
        this.errorMessage.set(msg);
      },
    });
  }
}
