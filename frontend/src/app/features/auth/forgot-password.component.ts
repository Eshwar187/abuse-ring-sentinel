import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Shield, Mail, CheckCircle2, ArrowLeft } from 'lucide-angular';

@Component({
  selector: 'app-forgot-password',
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
          Reset Merchant Password
        </h2>
        <p class="mt-2 text-xs text-slate-400">
          Enter your registered work email to receive password recovery instructions.
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div class="bg-slate-900/80 border border-slate-800 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl">
          <div *ngIf="isSubmitted(); else formState" class="text-center space-y-4">
            <div class="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <lucide-icon name="check-circle-2" [size]="24"></lucide-icon>
            </div>
            <h3 class="text-base font-bold text-white">Reset Link Dispatched</h3>
            <p class="text-xs text-slate-400">
              If an account is associated with <span class="text-slate-200 font-mono">{{ email }}</span>, an email with instructions has been sent.
            </p>
            <div class="pt-4">
              <a
                routerLink="/login"
                class="inline-flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                <lucide-icon name="arrow-left" [size]="14"></lucide-icon>
                <span>Back to Sign In</span>
              </a>
            </div>
          </div>

          <ng-template #formState>
            <form (ngSubmit)="onSubmit()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Work Email Address</label>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  placeholder="name@company.com"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div class="pt-2">
                <button
                  type="submit"
                  class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all"
                >
                  Send Reset Link
                </button>
              </div>

              <div class="text-center pt-2">
                <a routerLink="/login" class="text-xs text-slate-400 hover:text-slate-200">
                  Cancel and return to sign in
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
  email = '';
  readonly isSubmitted = signal(false);

  onSubmit() {
    if (this.email) {
      this.isSubmitted.set(true);
    }
  }
}
