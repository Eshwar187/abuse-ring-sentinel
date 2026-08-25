import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HealthService } from '../../core/services/health.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="w-64 bg-white border-r border-surface-200 flex flex-col h-screen flex-shrink-0 select-none">
      <!-- Brand Header -->
      <div class="p-5 border-b border-surface-200 flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-brand-500 text-white flex items-center justify-center font-black text-base shadow-sm">
          🛡️
        </div>
        <div>
          <h1 class="text-sm font-bold text-surface-900 tracking-tight leading-none">Abuse-Ring Sentinel</h1>
          <p class="text-[11px] text-surface-500 font-medium mt-1">Merchant Risk Intelligence</p>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div class="px-3 pb-2 text-[10px] font-bold text-surface-400 tracking-wider uppercase">
          Operations
        </div>

        <a
          routerLink="/dashboard"
          routerLinkActive="bg-brand-50 text-brand-600 font-semibold border-l-2 border-brand-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors text-xs"
        >
          <span class="text-base">📊</span>
          <span>Overview</span>
        </a>

        <a
          routerLink="/transactions"
          routerLinkActive="bg-brand-50 text-brand-600 font-semibold border-l-2 border-brand-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors text-xs"
        >
          <span class="text-base">💳</span>
          <span>Transactions</span>
        </a>

        <a
          routerLink="/risk-analyzer"
          routerLinkActive="bg-brand-50 text-brand-600 font-semibold border-l-2 border-brand-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors text-xs"
        >
          <span class="text-base">⚡</span>
          <span>Risk Analyzer</span>
          <span class="ml-auto px-1.5 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold rounded">LIVE</span>
        </a>

        <a
          routerLink="/risk-networks"
          routerLinkActive="bg-brand-50 text-brand-600 font-semibold border-l-2 border-brand-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors text-xs"
        >
          <span class="text-base">🕸️</span>
          <span>Risk Networks</span>
        </a>

        <div class="pt-4 px-3 pb-2 text-[10px] font-bold text-surface-400 tracking-wider uppercase">
          Governance & Monitoring
        </div>

        <a
          routerLink="/monitoring"
          routerLinkActive="bg-brand-50 text-brand-600 font-semibold border-l-2 border-brand-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors text-xs"
        >
          <span class="text-base">📈</span>
          <span>Monitoring</span>
        </a>

        <a
          routerLink="/audit"
          routerLinkActive="bg-brand-50 text-brand-600 font-semibold border-l-2 border-brand-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors text-xs"
        >
          <span class="text-base">📝</span>
          <span>Audit Log</span>
        </a>

        <div class="pt-4 px-3 pb-2 text-[10px] font-bold text-surface-400 tracking-wider uppercase">
          Developer & API
        </div>

        <a
          routerLink="/integration"
          routerLinkActive="bg-brand-50 text-brand-600 font-semibold border-l-2 border-brand-500"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors text-xs"
        >
          <span class="text-base">🔌</span>
          <span>Integration API</span>
          <span class="ml-auto px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">v1</span>
        </a>
      </nav>

      <!-- Bottom System Status Card -->
      <div class="p-3 border-t border-surface-200 bg-surface-50">
        <div class="p-3 bg-white border border-surface-200 rounded-lg shadow-sm">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] font-semibold text-surface-600">Model Engine</span>
            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              ACTIVE
            </span>
          </div>
          <div class="text-[11px] font-mono text-surface-500 space-y-0.5">
            <div>Version: <span class="text-surface-800 font-semibold">phase3-v1</span></div>
            <div>Policy: <span class="text-surface-800 font-semibold">tau=0.90</span></div>
          </div>
        </div>

        <!-- Operator Profile -->
        <div class="mt-3 flex items-center gap-2.5 px-1">
          <div class="w-7 h-7 rounded-full bg-surface-700 text-white flex items-center justify-center text-xs font-bold font-mono">
            OP
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-semibold text-surface-900 truncate">Risk Analyst</div>
            <div class="text-[10px] text-surface-400 truncate">Tier-1 Merchant Console</div>
          </div>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  health = inject(HealthService);
}
