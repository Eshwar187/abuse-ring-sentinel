import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Shield, Key, Copy, Check, ArrowRight, AlertCircle, Lock } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <a routerLink="/" class="inline-flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
            <lucide-icon name="shield" [size]="22"></lucide-icon>
          </div>
          <span class="text-xl font-bold tracking-tight text-white">Abuse-Ring Sentinel</span>
        </a>
        <h2 class="mt-6 text-2xl font-bold tracking-tight text-white">
          Create Merchant Account
        </h2>
        <p class="mt-2 text-xs text-slate-400">
          Already have an account? <a routerLink="/login" class="font-semibold text-rose-400 hover:text-rose-300">Sign in</a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <!-- Sign Up Form State -->
        <div *ngIf="!createdApiKey(); else apiKeySuccessState" class="bg-slate-900/80 border border-slate-800 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl">
          <!-- Error Alert -->
          <div *ngIf="errorMessage()" class="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
            <lucide-icon name="alert-circle" [size]="16" class="text-rose-400 shrink-0 mt-0.5"></lucide-icon>
            <div>{{ errorMessage() }}</div>
          </div>

          <form (ngSubmit)="onSignup()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                [(ngModel)]="fullName"
                name="fullName"
                required
                placeholder="Sarah Connor"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                placeholder="sarah&#64;apexretail.com"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Company / Merchant Name</label>
              <input
                type="text"
                [(ngModel)]="companyName"
                name="companyName"
                required
                placeholder="Apex Retail Global"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
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
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div class="pt-2">
              <button
                type="submit"
                [disabled]="isLoading()"
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                <span>{{ isLoading() ? 'Creating Merchant Account...' : 'Register & Generate API Key' }}</span>
                <lucide-icon name="arrow-right" [size]="14"></lucide-icon>
              </button>
            </div>
          </form>
        </div>

        <!-- API Key Revealed Once Modal/State -->
        <ng-template #apiKeySuccessState>
          <div class="bg-slate-900/90 border border-emerald-500/30 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl text-center space-y-5 animate-fade-in">
            <div class="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <lucide-icon name="key" [size]="24"></lucide-icon>
            </div>

            <div>
              <h3 class="text-lg font-bold text-white">Merchant Account Created!</h3>
              <p class="text-xs text-slate-400 mt-1">
                Your primary production API credential has been generated.
              </p>
            </div>

            <!-- Warning Callout -->
            <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 text-left flex items-start gap-2.5">
              <lucide-icon name="lock" [size]="16" class="text-amber-400 shrink-0 mt-0.5"></lucide-icon>
              <div>
                <strong>Important</strong>: Your API key is shown once. Store it securely in your environment variables or secrets manager.
              </div>
            </div>

            <!-- Copyable Key Box -->
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-left">
              <div class="font-mono text-xs text-emerald-400 font-semibold truncate select-all">
                {{ createdApiKey() }}
              </div>
              <button
                (click)="copyApiKey()"
                class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors shrink-0"
              >
                <lucide-icon [name]="isCopied() ? 'check' : 'copy'" [size]="13" [class.text-emerald-400]="isCopied()"></lucide-icon>
                <span>{{ isCopied() ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>

            <div class="pt-2">
              <button
                (click)="continueToOnboarding()"
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
              >
                <span>Continue to Integration Onboarding</span>
                <lucide-icon name="arrow-right" [size]="14"></lucide-icon>
              </button>
            </div>
          </div>
        </ng-template>
      </div>
    </div>
  `,
})
export class SignupComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  fullName = '';
  email = '';
  companyName = '';
  password = '';

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly createdApiKey = signal<string | null>(null);
  readonly isCopied = signal(false);

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
