import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MerchantService } from '../../core/services/merchant.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-live-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 font-sans select-none pb-12 max-w-7xl mx-auto">
      <!-- 1. Hero Welcome & Real Merchant Status Banner -->
      <div class="p-6 sm:p-7 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div class="relative z-10 max-w-xl">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              Tenant ID: {{ auth.currentUser()?.merchant_id || 'Isolated' }}
            </span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Welcome, {{ auth.currentUser()?.company_name || 'Merchant' }}</span>
            <span class="text-xl">👋</span>
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Your dedicated fraud defense environment is active. Real-time decision boundary is operating at cost-optimal threshold <strong>&tau;* = 0.90</strong>.
          </p>
        </div>

        <!-- Center 3D Holographic Shield Emblem -->
        <div class="hidden xl:flex items-center justify-center relative z-10">
          <div class="relative w-24 h-24 flex items-center justify-center">
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 rounded-full blur-xl animate-pulse-slow"></div>
            <div class="w-18 h-18 rounded-2xl bg-[#080D1A] border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(6,182,212,0.35)] flex items-center justify-center p-3">
              <svg class="w-10 h-10 text-cyan-400 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Right System Health Mini Widget -->
        <div class="relative z-10 bg-[#060A14]/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-w-[240px]">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-white">Tenant Connection</span>
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <div class="text-[11px] text-emerald-300 font-mono mt-1 font-semibold">
            All Systems Operational
          </div>
          
          <!-- Mini SVG ECG Pulse wave -->
          <div class="my-2 h-7 w-full overflow-hidden">
            <svg class="w-full h-full text-emerald-400" viewBox="0 0 100 25" preserveAspectRatio="none" fill="none" stroke="currentColor">
              <path stroke-width="1.8" d="M0 12 L20 12 L25 5 L30 20 L35 8 L40 16 L45 12 L70 12 L75 3 L80 22 L85 12 L100 12" />
            </svg>
          </div>

          <div class="text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>Last Sync: Just now</span>
            <button (click)="refreshData()" class="text-cyan-400 hover:text-cyan-300 transition-colors">
              Refresh ↻
            </button>
          </div>
        </div>
      </div>

      <!-- ZERO-DATA ONBOARDING BANNER (Only visible when user has 0 transactions) -->
      <div *ngIf="totalTransactionsCount() === 0" class="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-[#0B132B] to-purple-950/40 border border-cyan-500/30 shadow-2xl backdrop-blur-2xl animate-fade-in">
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div class="space-y-2 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
              <span>🚀 NEW TENANT INITIALIZATION</span>
            </div>
            <h3 class="text-xl font-extrabold text-white">No Transactions Evaluated Yet</h3>
            <p class="text-xs text-slate-300 leading-relaxed">
              Your account is freshly provisioned and securely partitioned. To view live graph clusters and fraud statistics, 
              send your first API transaction or upload a historical transaction CSV batch.
            </p>
          </div>

          <!-- Quick Action Buttons for New User -->
          <div class="flex flex-wrap items-center gap-3 shrink-0">
            <a
              routerLink="/app/onboarding"
              class="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-mono transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <span>📁 Upload CSV Batch</span>
              <span>→</span>
            </a>
            <a
              routerLink="/app/risk-analyzer"
              class="px-4 py-2.5 rounded-xl bg-[#030712] hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold font-mono transition-all flex items-center gap-2"
            >
              <span>⚡ Test Risk Analyzer</span>
            </a>
            <a
              routerLink="/app/integration"
              class="px-4 py-2.5 rounded-xl bg-[#030712] hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold font-mono transition-all flex items-center gap-2"
            >
              <span>🔑 Get API Key</span>
            </a>
          </div>
        </div>
      </div>

      <!-- 2. Top 5 Real KPI Metric Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        <!-- Live Volume -->
        <div class="p-5 rounded-2xl bg-[#0B132B]/85 border border-slate-800 hover:border-cyan-500/40 shadow-xl backdrop-blur-xl transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 font-sans">Live Volume</span>
            <div class="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div class="mt-2 text-2xl lg:text-3xl font-extrabold text-white font-mono tracking-tight">
            {{ totalTransactionsCount() | number }}
          </div>
          <div class="mt-1 flex items-center justify-between text-[11px] font-mono">
            <span class="text-slate-500">Evaluations</span>
            <span class="text-cyan-400 font-bold" *ngIf="totalTransactionsCount() > 0">Live</span>
            <span class="text-slate-600" *ngIf="totalTransactionsCount() === 0">0 Events</span>
          </div>
        </div>

        <!-- Approval Rate -->
        <div class="p-5 rounded-2xl bg-[#0B132B]/85 border border-slate-800 hover:border-emerald-500/40 shadow-xl backdrop-blur-xl transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 font-sans">Approval Rate</span>
            <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div class="mt-2 text-2xl lg:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            {{ approvalRateText() }}
          </div>
          <div class="mt-1 flex items-center justify-between text-[11px] font-mono">
            <span class="text-slate-500">Cleared ({{ approvalsCount() }})</span>
            <span class="text-emerald-400 font-bold" *ngIf="totalTransactionsCount() > 0">Active</span>
            <span class="text-slate-600" *ngIf="totalTransactionsCount() === 0">—</span>
          </div>
        </div>

        <!-- Review Rate -->
        <div class="p-5 rounded-2xl bg-[#0B132B]/85 border border-slate-800 hover:border-amber-500/40 shadow-xl backdrop-blur-xl transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 font-sans">Review Rate</span>
            <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div class="mt-2 text-2xl lg:text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
            {{ reviewRateText() }}
          </div>
          <div class="mt-1 flex items-center justify-between text-[11px] font-mono">
            <span class="text-slate-500">2FA Step-up ({{ reviewsCount() }})</span>
            <span class="text-amber-400 font-bold" *ngIf="totalTransactionsCount() > 0">Active</span>
            <span class="text-slate-600" *ngIf="totalTransactionsCount() === 0">—</span>
          </div>
        </div>

        <!-- Block Rate -->
        <div class="p-5 rounded-2xl bg-[#0B132B]/85 border border-slate-800 hover:border-rose-500/40 shadow-xl backdrop-blur-xl transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 font-sans">Block Rate</span>
            <div class="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
          <div class="mt-2 text-2xl lg:text-3xl font-extrabold text-rose-400 font-mono tracking-tight">
            {{ blockRateText() }}
          </div>
          <div class="mt-1 flex items-center justify-between text-[11px] font-mono">
            <span class="text-slate-500">Syndicates ({{ blocksCount() }})</span>
            <span class="text-rose-400 font-bold" *ngIf="totalTransactionsCount() > 0">Protected</span>
            <span class="text-slate-600" *ngIf="totalTransactionsCount() === 0">—</span>
          </div>
        </div>

        <!-- Mean Risk Score -->
        <div class="p-5 rounded-2xl bg-[#0B132B]/85 border border-slate-800 hover:border-purple-500/40 shadow-xl backdrop-blur-xl transition-all col-span-2 sm:col-span-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 font-sans">Mean Risk Score</span>
            <div class="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="mt-2 text-2xl lg:text-3xl font-extrabold text-purple-300 font-mono tracking-tight">
            {{ meanRiskScoreText() }}
          </div>
          <div class="mt-1 flex items-center justify-between text-[11px] font-mono">
            <span class="text-slate-500">GBDT Probability</span>
            <span class="text-purple-400 font-bold" *ngIf="totalTransactionsCount() > 0">Model F</span>
            <span class="text-slate-600" *ngIf="totalTransactionsCount() === 0">—</span>
          </div>
        </div>
      </div>

      <!-- 3. Recent Real Transactions List -->
      <div class="rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl p-6 backdrop-blur-2xl space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 class="text-base font-extrabold text-white tracking-tight">Live Evaluated Transactions</h3>
            <p class="text-xs text-slate-400 mt-0.5">Real-time risk scoring stream from your merchant endpoints</p>
          </div>
          <a
            routerLink="/app/transactions"
            class="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-semibold transition-colors"
          >
            View Full Transaction History →
          </a>
        </div>

        <!-- If Transactions Exist -->
        <div *ngIf="recentTransactions().length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 text-[11px]">
                <th class="py-3 px-3">Transaction ID</th>
                <th class="py-3 px-3">User ID</th>
                <th class="py-3 px-3">Amount</th>
                <th class="py-3 px-3">Risk Score</th>
                <th class="py-3 px-3">Decision</th>
                <th class="py-3 px-3">Timestamp</th>
                <th class="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr *ngFor="let tx of recentTransactions()" class="hover:bg-slate-900/40 transition-colors">
                <td class="py-3 px-3 text-cyan-300 font-bold">{{ tx.transaction_id }}</td>
                <td class="py-3 px-3 text-slate-300">{{ tx.user_id }}</td>
                <td class="py-3 px-3 text-white font-bold">{{ tx.currency }} {{ tx.amount | number:'1.2-2' }}</td>
                <td class="py-3 px-3">
                  <span class="font-bold" [class.text-rose-400]="tx.risk_score >= 0.90" [class.text-amber-400]="tx.risk_score >= 0.50 && tx.risk_score < 0.90" [class.text-emerald-400]="tx.risk_score < 0.50">
                    {{ tx.risk_score | number:'1.4-4' }}
                  </span>
                </td>
                <td class="py-3 px-3">
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold"
                    [class.bg-rose-500-20]="tx.decision === 'BLOCK'"
                    [class.text-rose-400]="tx.decision === 'BLOCK'"
                    [class.bg-amber-500-20]="tx.decision === 'REVIEW'"
                    [class.text-amber-400]="tx.decision === 'REVIEW'"
                    [class.bg-emerald-500-20]="tx.decision === 'APPROVE'"
                    [class.text-emerald-400]="tx.decision === 'APPROVE'"
                  >
                    {{ tx.decision }}
                  </span>
                </td>
                <td class="py-3 px-3 text-slate-400 text-[10px]">{{ tx.timestamp }}</td>
                <td class="py-3 px-3 text-right">
                  <a
                    [routerLink]="['/app/transactions', tx.transaction_id]"
                    class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] transition-colors"
                  >
                    Details →
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Zero Transactions Empty State -->
        <div *ngIf="recentTransactions().length === 0" class="py-12 text-center text-xs text-slate-400 space-y-3 font-mono">
          <div class="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-800 mx-auto flex items-center justify-center text-xl text-slate-500">
            📊
          </div>
          <div class="text-slate-300 font-bold">No Real Transactions Recorded Yet</div>
          <p class="text-slate-500 max-w-sm mx-auto">
            Transactions evaluated with your API key will appear in this real-time feed instantly.
          </p>
          <div class="pt-2">
            <a
              routerLink="/app/risk-analyzer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all"
            >
              <span>▶ Evaluate First Transaction</span>
            </a>
          </div>
        </div>
      </div>

      <!-- 4. Fast Navigation Hub -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <a
          routerLink="/app/risk-analyzer"
          class="p-4 rounded-2xl bg-[#0B132B]/85 border border-slate-800 hover:border-cyan-500/40 text-center transition-all flex flex-col items-center justify-center group"
        >
          <div class="text-xl mb-1 group-hover:scale-110 transition-transform">⚡</div>
          <div class="text-xs font-bold text-white group-hover:text-cyan-300">Risk Analyzer</div>
          <div class="text-[10px] text-slate-500 font-mono">Evaluate Event</div>
        </a>

        <a
          routerLink="/app/networks"
          class="p-4 rounded-2xl bg-[#0B132B]/85 border border-slate-800 hover:border-purple-500/40 text-center transition-all flex flex-col items-center justify-center group"
        >
          <div class="text-xl mb-1 group-hover:scale-110 transition-transform">🕸️</div>
          <div class="text-xs font-bold text-white group-hover:text-purple-300">Entity Networks</div>
          <div class="text-[10px] text-slate-500 font-mono">Collusion Graphs</div>
        </a>

        <a
          routerLink="/app/onboarding"
          class="p-4 rounded-2xl bg-[#0B132B]/85 border border-slate-800 hover:border-emerald-500/40 text-center transition-all flex flex-col items-center justify-center group"
        >
          <div class="text-xl mb-1 group-hover:scale-110 transition-transform">📁</div>
          <div class="text-xs font-bold text-white group-hover:text-emerald-300">Data Ingestion</div>
          <div class="text-[10px] text-slate-500 font-mono">Upload CSV</div>
        </a>

        <a
          routerLink="/app/integration"
          class="p-4 rounded-2xl bg-[#0B132B]/85 border border-slate-800 hover:border-blue-500/40 text-center transition-all flex flex-col items-center justify-center group"
        >
          <div class="text-xl mb-1 group-hover:scale-110 transition-transform">🔑</div>
          <div class="text-xs font-bold text-white group-hover:text-blue-300">API Credentials</div>
          <div class="text-[10px] text-slate-500 font-mono">SDK Docs</div>
        </a>
      </div>
    </div>
  `,
})
export class LiveOverviewComponent implements OnInit, OnDestroy {
  merchantService = inject(MerchantService);
  auth = inject(AuthService);

  readonly metrics = this.merchantService.liveMetrics;
  readonly liveTransactions = this.merchantService.liveTransactions;

  private refreshInterval: any;

  ngOnInit(): void {
    this.refreshData();
    // Poll for real transaction updates every 15s
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  refreshData(): void {
    this.merchantService.getLiveMetrics().subscribe();
    this.merchantService.getLiveTransactions('', '', '', 1, 10).subscribe();
  }

  totalTransactionsCount(): number {
    return this.metrics()?.total_transactions || 0;
  }

  approvalsCount(): number {
    return this.metrics()?.approvals || 0;
  }

  reviewsCount(): number {
    return this.metrics()?.reviews || 0;
  }

  blocksCount(): number {
    return this.metrics()?.blocks || 0;
  }

  approvalRateText(): string {
    const m = this.metrics();
    if (m && m.total_transactions > 0) {
      return (m.approval_rate * 100).toFixed(1) + '%';
    }
    return '0.0%';
  }

  reviewRateText(): string {
    const m = this.metrics();
    if (m && m.total_transactions > 0) {
      return (m.review_rate * 100).toFixed(1) + '%';
    }
    return '0.0%';
  }

  blockRateText(): string {
    const m = this.metrics();
    if (m && m.total_transactions > 0) {
      return (m.block_rate * 100).toFixed(1) + '%';
    }
    return '0.0%';
  }

  meanRiskScoreText(): string {
    const m = this.metrics();
    if (m && m.total_transactions > 0) {
      return m.average_risk_score.toFixed(3);
    }
    return '0.000';
  }

  recentTransactions(): any[] {
    const txs = this.liveTransactions();
    if (txs && txs.length > 0) {
      return txs;
    }
    const metricsRecent = this.metrics()?.recent_transactions;
    if (metricsRecent && metricsRecent.length > 0) {
      return metricsRecent;
    }
    return [];
  }
}
