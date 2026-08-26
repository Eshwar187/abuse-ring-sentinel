import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HealthService } from '../../core/services/health.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="w-64 bg-[#060A14] border-r border-slate-800/80 flex flex-col h-screen flex-shrink-0 select-none text-slate-300 font-sans z-30">
      <!-- Brand Header with Glowing Shield -->
      <div class="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#080D1A]/60 backdrop-blur-md">
        <a routerLink="/app/overview" class="flex items-center gap-3 group">
          <div class="relative">
            <div class="w-10 h-10 rounded-xl bg-[#0B132B] border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:scale-105 transition-all">
              <svg class="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span class="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h1 class="text-sm font-extrabold text-white tracking-tight group-hover:text-cyan-300 transition-colors">VigilAI</h1>
              <span class="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30 font-bold">PRO</span>
            </div>
            <p class="text-[10px] text-slate-400 font-mono">Autonomous Fraud Defense</p>
          </div>
        </a>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <!-- Overview -->
        <a
          routerLink="/app/overview"
          routerLinkActive="bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <svg class="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Overview</span>
        </a>

        <!-- Live Transactions -->
        <a
          routerLink="/app/transactions"
          routerLinkActive="bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <svg class="w-4 h-4 text-slate-400 group-hover:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>Live Transactions</span>
        </a>

        <!-- Risk Analyzer -->
        <a
          routerLink="/app/risk-analyzer"
          routerLinkActive="bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <svg class="w-4 h-4 text-slate-400 group-hover:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Risk Analyzer</span>
        </a>

        <!-- Entity Networks -->
        <a
          routerLink="/app/risk-networks"
          routerLinkActive="bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <svg class="w-4 h-4 text-slate-400 group-hover:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Entity Networks</span>
        </a>

        <!-- Alerts -->
        <a
          routerLink="/app/monitoring"
          routerLinkActive="bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <svg class="w-4 h-4 text-slate-400 group-hover:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span>Alerts</span>
          <span class="ml-auto px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-full border border-purple-500/30 font-mono">12</span>
        </a>

        <!-- Risk Monitor -->
        <a
          routerLink="/app/monitoring"
          routerLinkActive="bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <svg class="w-4 h-4 text-slate-400 group-hover:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Risk Monitor</span>
        </a>

        <!-- Integrations -->
        <a
          routerLink="/app/integration"
          routerLinkActive="bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <svg class="w-4 h-4 text-slate-400 group-hover:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Integrations</span>
        </a>

        <!-- Audit Log -->
        <a
          routerLink="/app/audit"
          routerLinkActive="bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <svg class="w-4 h-4 text-slate-400 group-hover:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Audit Log</span>
        </a>

        <!-- Settings -->
        <a
          routerLink="/app/settings"
          routerLinkActive="bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all text-xs group"
        >
          <svg class="w-4 h-4 text-slate-400 group-hover:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </a>
      </nav>

      <!-- Bottom User Profile & Collapse Icon -->
      <div class="p-3 border-t border-slate-800/80 bg-[#080D1A]/80 backdrop-blur-md">
        <div class="flex items-center justify-between gap-2 p-2 bg-[#0B132B] border border-slate-800 rounded-xl">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              {{ auth.currentUser()?.full_name?.charAt(0) || 'E' }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-semibold text-white truncate">
                {{ auth.currentUser()?.company_name || 'Enterprise' }}
              </div>
              <div class="text-[10px] text-slate-400 font-mono truncate">
                {{ auth.currentUser()?.email || 'eshwar@enterprise.com' }}
              </div>
            </div>
          </div>

          <button
            type="button"
            (click)="auth.logout()"
            class="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all shrink-0"
            title="Sign Out"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
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
