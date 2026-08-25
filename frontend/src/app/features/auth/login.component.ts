import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Shield, Lock, Mail, ArrowRight, AlertCircle, Play } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <a routerLink="/" class="inline-flex items-center gap-3">
          <img src="logo.svg" alt="Abuse-Ring Sentinel Logo" class="w-11 h-11 rounded-xl shadow-lg shadow-rose-600/30 object-contain" />
          <span class="text-xl font-bold tracking-tight text-white">Abuse-Ring Sentinel</span>
        </a>
        <h2 class="mt-6 text-2xl font-bold tracking-tight text-white">
          Sign in to Merchant Risk Console
        </h2>
        <p class="mt-2 text-xs text-slate-400">
          Or <a routerLink="/signup" class="font-semibold text-rose-400 hover:text-rose-300">create a new merchant account</a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div class="bg-slate-900/80 border border-slate-800 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl">
          <!-- Error Alert -->
          <div *ngIf="errorMessage()" class="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
            <lucide-icon name="alert-circle" [size]="16" class="text-rose-400 shrink-0 mt-0.5"></lucide-icon>
            <div>{{ errorMessage() }}</div>
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
                  placeholder="name@company.com"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-slate-300">Password</label>
                <a routerLink="/forgot-password" class="text-[11px] text-slate-400 hover:text-rose-400">Forgot password?</a>
              </div>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="••••••••••••"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div class="pt-2">
              <button
                type="submit"
                [disabled]="isLoading()"
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                <span>{{ isLoading() ? 'Signing in...' : 'Sign In to Console' }}</span>
                <lucide-icon name="arrow-right" [size]="14"></lucide-icon>
              </button>
            </div>
          </form>

          <!-- Quick Fill Demo Merchant Credentials -->
          <div class="mt-6 pt-6 border-t border-slate-800">
            <div class="text-[11px] font-medium text-slate-400 mb-2.5 text-center">Development Quick Login</div>
            <button
              type="button"
              (click)="quickFillDevAccount()"
              class="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-colors"
            >
              <span>Fill: dev&#64;apexretail.com (Admin)</span>
            </button>
          </div>
        </div>

        <div class="mt-6 text-center">
          <a routerLink="/demo" class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors">
            <lucide-icon name="play" [size]="12"></lucide-icon>
            <span>Looking for the 6,929-transaction Benchmark Demo? Click here</span>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  quickFillDevAccount() {
    this.email = 'dev@apexretail.com';
    this.password = 'Password123!';
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please enter both email and password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/app/overview';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Invalid login credentials.');
      },
    });
  }
}
