import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LogOut, Settings, Play, Shield, Activity, Lock, Database, LayoutDashboard, CreditCard, Zap, Share2, LineChart, FileText, Plug, Sliders } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { HealthService } from '../../core/services/health.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <aside class="w-64 bg-[#060A14] border-r border-slate-800/80 flex flex-col h-screen flex-shrink-0 select-none text-slate-300 font-sans z-30">
      <!-- Brand Header -->
      <div class="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#080D1A]/60 backdrop-blur-md">
        <a routerLink="/app/overview" class="flex items-center gap-3 group">
          <div class="relative">
            <img src="vigilai_logo.jpg" alt="VigilAI Logo" class="w-10 h-10 rounded-xl shadow-lg shadow-cyan-500/20 object-cover border border-cyan-500/40 group-hover:border-cyan-400 transition-all group-hover:scale-105" />
            <span class="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 border-2 border-[#060A14]"></span>
            </span>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h1 class="text-sm font-bold text-white tracking-tight leading-tight group-hover:text-cyan-300 transition-colors">VigilAI</h1>
              <span class="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">PRO</span>
            </div>
            <p class="text-[10px] text-slate-400 font-mono">Autonomous Fraud Defense</p>
          </div>
        </a>
      </div>

      <!-- Demo Benchmark Switcher -->
      <div class="p-3 border-b border-slate-800/60 bg-[#0B132B]/40">
        <a
          routerLink="/demo"
          class="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 hover:from-amber-500/20 hover:to-amber-500/10 border border-amber-500/25 text-[11px] font-semibold text-amber-300 transition-all group"
        >
          <span class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span class="group-hover:text-amber-200 transition-colors">Benchmark (6.9k CSV)</span>
          </span>
          <span class="text-[9px] px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">DEMO</span>
        </a>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div class="px-3 pb-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
          Live Operations
        </div>

        <a
          routerLink="/app/overview"
          routerLinkActive="bg-cyan-500/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <span class="text-sm">📊</span>
          <span>Live Overview</span>
        </a>

        <a
          routerLink="/app/transactions"
          routerLinkActive="bg-cyan-500/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <span class="text-sm">💳</span>
          <span>Transactions</span>
        </a>

        <a
          routerLink="/app/risk-analyzer"
          routerLinkActive="bg-cyan-500/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <span class="text-sm">⚡</span>
          <span>Risk Analyzer</span>
          <span class="ml-auto px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 text-[9px] font-bold rounded font-mono border border-cyan-500/30">LIVE</span>
        </a>

        <a
          routerLink="/app/risk-networks"
          routerLinkActive="bg-cyan-500/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <span class="text-sm">🕸️</span>
          <span>Entity Networks</span>
        </a>

        <div class="pt-4 px-3 pb-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
          Governance & Audit
        </div>

        <a
          routerLink="/app/monitoring"
          routerLinkActive="bg-cyan-500/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <span class="text-sm">📈</span>
          <span>Monitoring</span>
        </a>

        <a
          routerLink="/app/audit"
          routerLinkActive="bg-cyan-500/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <span class="text-sm">📝</span>
          <span>Audit Log</span>
        </a>

        <div class="pt-4 px-3 pb-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
          Developer & Settings
        </div>

        <a
          routerLink="/app/integration"
          routerLinkActive="bg-cyan-500/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <span class="text-sm">🔌</span>
          <span>Integration API</span>
          <span class="ml-auto px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded font-mono border border-emerald-500/30">v1</span>
        </a>

        <a
          routerLink="/app/settings"
          routerLinkActive="bg-cyan-500/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <span class="text-sm">⚙️</span>
          <span>Settings & Keys</span>
        </a>
      </nav>

      <!-- Bottom User Profile & Logout -->
      <div class="p-3 border-t border-slate-800/80 bg-[#080D1A]/80 backdrop-blur-md">
        <div class="flex items-center justify-between gap-2 p-2 bg-[#0B132B] border border-slate-800 rounded-xl shadow-inner">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
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
            class="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all shrink-0"
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
