import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LogOut, Settings, Play, Shield, Activity, Lock, Database } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { HealthService } from '../../core/services/health.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <aside class="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen flex-shrink-0 select-none text-slate-300 font-sans">
      <!-- Brand Header -->
      <div class="p-4 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img src="logo.svg" alt="Abuse-Ring Sentinel Logo" class="w-8 h-8 rounded-lg shadow-md shadow-rose-600/30 object-contain" />
          <div>
            <h1 class="text-xs font-bold text-white tracking-tight leading-tight">Abuse-Ring Sentinel</h1>
            <p class="text-[10px] text-slate-400 font-mono">Merchant Risk Console</p>
          </div>
        </div>
      </div>

      <!-- Demo vs Live Quick Mode Switcher Banner -->
      <div class="p-3 border-b border-slate-800/80 bg-slate-900/40">
        <a
          routerLink="/demo"
          class="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-[11px] font-semibold text-amber-300 transition-colors"
        >
          <span class="flex items-center gap-1.5">
            <lucide-icon name="play" [size]="12" class="text-amber-400"></lucide-icon>
            <span>Demo Benchmark (6.9k)</span>
          </span>
          <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">DEMO</span>
        </a>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div class="px-3 pb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
          Live Operations
        </div>

        <a
          routerLink="/app/overview"
          routerLinkActive="bg-rose-600/10 text-rose-400 font-semibold border-l-2 border-rose-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-xs"
        >
          <span class="text-sm">📊</span>
          <span>Live Overview</span>
        </a>

        <a
          routerLink="/app/transactions"
          routerLinkActive="bg-rose-600/10 text-rose-400 font-semibold border-l-2 border-rose-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-xs"
        >
          <span class="text-sm">💳</span>
          <span>Transactions</span>
        </a>

        <a
          routerLink="/app/risk-analyzer"
          routerLinkActive="bg-rose-600/10 text-rose-400 font-semibold border-l-2 border-rose-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-xs"
        >
          <span class="text-sm">⚡</span>
          <span>Risk Analyzer</span>
          <span class="ml-auto px-1.5 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded">LIVE</span>
        </a>

        <a
          routerLink="/app/risk-networks"
          routerLinkActive="bg-rose-600/10 text-rose-400 font-semibold border-l-2 border-rose-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-xs"
        >
          <span class="text-sm">🕸️</span>
          <span>Entity Networks</span>
        </a>

        <div class="pt-4 px-3 pb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
          Governance & Audit
        </div>

        <a
          routerLink="/app/monitoring"
          routerLinkActive="bg-rose-600/10 text-rose-400 font-semibold border-l-2 border-rose-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-xs"
        >
          <span class="text-sm">📈</span>
          <span>Monitoring</span>
        </a>

        <a
          routerLink="/app/audit"
          routerLinkActive="bg-rose-600/10 text-rose-400 font-semibold border-l-2 border-rose-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-xs"
        >
          <span class="text-sm">📝</span>
          <span>Audit Log</span>
        </a>

        <div class="pt-4 px-3 pb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
          Developer & Settings
        </div>

        <a
          routerLink="/app/integration"
          routerLinkActive="bg-rose-600/10 text-rose-400 font-semibold border-l-2 border-rose-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-xs"
        >
          <span class="text-sm">🔌</span>
          <span>Integration API</span>
          <span class="ml-auto px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded font-mono">v1</span>
        </a>

        <a
          routerLink="/app/settings"
          routerLinkActive="bg-rose-600/10 text-rose-400 font-semibold border-l-2 border-rose-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-xs"
        >
          <span class="text-sm">⚙️</span>
          <span>Settings & Keys</span>
        </a>
      </nav>

      <!-- Bottom User Profile & Logout -->
      <div class="p-3 border-t border-slate-800 bg-slate-900/50">
        <div class="flex items-center justify-between gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg">
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-7 h-7 rounded-full bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
              {{ auth.currentUser()?.full_name?.charAt(0) || 'M' }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-semibold text-white truncate">
                {{ auth.currentUser()?.company_name || 'Merchant Tenant' }}
              </div>
              <div class="text-[10px] text-slate-400 font-mono truncate">
                {{ auth.currentUser()?.email }}
              </div>
            </div>
          </div>

          <button
            type="button"
            (click)="auth.logout()"
            class="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors shrink-0"
            title="Sign Out"
          >
            <lucide-icon name="log-out" [size]="14"></lucide-icon>
          </button>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  auth = inject(AuthService);
  health = inject(HealthService);
}
