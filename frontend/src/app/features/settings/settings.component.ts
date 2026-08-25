import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Shield,
  Key,
  RefreshCw,
  Copy,
  Check,
  Building,
  User,
  Mail,
  Lock,
  AlertTriangle,
  Server,
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-6 font-sans max-w-4xl">
      <!-- Header -->
      <div>
        <h2 class="text-xl font-bold text-white tracking-tight">Merchant Settings & API Credentials</h2>
        <p class="text-xs text-slate-400 mt-1">
          Manage your organization profile, security tokens, and gateway configuration.
        </p>
      </div>

      <!-- Merchant Profile Card -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div class="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <lucide-icon name="building" [size]="18"></lucide-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Organization Profile</h3>
            <p class="text-xs text-slate-400">Authenticated merchant tenant details</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div class="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span class="text-[10px] text-slate-400 font-sans uppercase font-bold block mb-1">Company Name</span>
            <span class="text-white font-sans font-bold text-sm">{{ auth.currentUser()?.company_name }}</span>
          </div>

          <div class="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span class="text-[10px] text-slate-400 font-sans uppercase font-bold block mb-1">Merchant Tenant ID</span>
            <span class="text-slate-300">{{ auth.currentUser()?.merchant_id }}</span>
          </div>

          <div class="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span class="text-[10px] text-slate-400 font-sans uppercase font-bold block mb-1">Primary Administrator</span>
            <span class="text-slate-300 font-sans">{{ auth.currentUser()?.full_name }}</span>
          </div>

          <div class="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span class="text-[10px] text-slate-400 font-sans uppercase font-bold block mb-1">Registered Email</span>
            <span class="text-slate-300">{{ auth.currentUser()?.email }}</span>
          </div>
        </div>
      </div>

      <!-- API Credentials & Key Rotation Card -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <lucide-icon name="key" [size]="18"></lucide-icon>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">API Credentials & Key Management</h3>
              <p class="text-xs text-slate-400">Server-to-server gateway authentication</p>
            </div>
          </div>

          <button
            type="button"
            (click)="rotateApiKey()"
            [disabled]="isRotating()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-xs font-semibold text-rose-300 transition-colors disabled:opacity-50"
          >
            <lucide-icon name="refresh-cw" [size]="12" [class.animate-spin]="isRotating()"></lucide-icon>
            <span>{{ isRotating() ? 'Rotating Key...' : 'Rotate API Key' }}</span>
          </button>
        </div>

        <!-- Masked Key Display -->
        <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div class="text-[10px] uppercase font-bold text-slate-400 font-sans">Active Key Prefix</div>
            <div class="font-mono text-sm text-emerald-400 font-semibold mt-1">
              {{ auth.currentUser()?.api_key_masked }}
            </div>
          </div>
          <span class="text-[11px] px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono">
            Active
          </span>
        </div>

        <!-- Key Rotated Success Banner (Shown when user rotates key) -->
        <div *ngIf="newRotatedKey()" class="p-4 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-3 animate-fade-in">
          <div class="flex items-center justify-between text-xs text-emerald-400 font-bold">
            <span class="flex items-center gap-1.5">
              <lucide-icon name="check" [size]="14"></lucide-icon>
              New API Key Successfully Generated!
            </span>
            <span class="text-amber-400 font-normal">Previous key has been revoked.</span>
          </div>

          <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-3">
            <span class="font-mono text-xs text-emerald-300 font-bold select-all truncate">
              {{ newRotatedKey() }}
            </span>
            <button
              (click)="copyNewKey()"
              class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 shrink-0"
            >
              <lucide-icon [name]="isCopied() ? 'check' : 'copy'" [size]="12"></lucide-icon>
              <span>{{ isCopied() ? 'Copied' : 'Copy' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Governance & Security Specifications Card -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div class="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <lucide-icon name="shield" [size]="18"></lucide-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Model Governance & Security Specifications</h3>
            <p class="text-xs text-slate-400">Audited parameters and production invariants</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">Inference Engine</div>
            <div class="text-white font-mono font-semibold">HistGradientBoosting</div>
            <div class="text-[10px] text-emerald-400 mt-1">Status: Frozen (SHA-256 verified)</div>
          </div>

          <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">Decision Policy</div>
            <div class="text-white font-mono font-semibold">Fixed Threshold τ* = 0.90</div>
            <div class="text-[10px] text-slate-400 mt-1">&lt;0.50 (Approve) | ≥0.90 (Block)</div>
          </div>

          <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">Feature Contract</div>
            <div class="text-white font-mono font-semibold">33 Combined Features</div>
            <div class="text-[10px] text-slate-400 mt-1">21 Behavioral + 12 Relational Graph</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  auth = inject(AuthService);

  readonly isRotating = signal(false);
  readonly newRotatedKey = signal<string | null>(null);
  readonly isCopied = signal(false);

  rotateApiKey() {
    if (!confirm('Are you sure you want to rotate your API key? The current key will be immediately revoked.')) {
      return;
    }

    this.isRotating.set(true);
    this.auth.rotateApiKey().subscribe({
      next: (res) => {
        this.isRotating.set(false);
        this.newRotatedKey.set(res.new_api_key);
      },
      error: () => {
        this.isRotating.set(false);
      },
    });
  }

  copyNewKey() {
    const key = this.newRotatedKey();
    if (key) {
      navigator.clipboard.writeText(key);
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    }
  }
}
