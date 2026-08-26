import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Shield,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Inbox,
  Lock,
  Plus,
  TrendingUp,
  Cpu,
  Database,
  ExternalLink,
} from 'lucide-angular';

import { MetricCardComponent } from '../../shared/components/metric-card.component';
import { DecisionBadgeComponent } from '../../shared/components/decision-badge.component';
import { MerchantService } from '../../core/services/merchant.service';
import { AuthService } from '../../core/services/auth.service';
import { LiveMerchantMetrics } from '../../core/models/auth.models';

@Component({
  selector: 'app-live-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    DecisionBadgeComponent,
  ],
  template: `
    <div class="space-y-8 font-sans">
      <!-- Live Merchant HUD Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#080D1A] to-[#060A14] border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div class="relative z-10">
          <div class="flex items-center gap-2.5">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              REAL-TIME RISK SHIELD
            </span>
            <span class="text-xs text-slate-400 font-mono">Tenant: <span class="text-cyan-400 font-semibold">{{ auth.currentUser()?.merchant_id }}</span></span>
          </div>

          <h2 class="text-2xl font-extrabold text-white tracking-tight mt-2 flex items-center gap-3">
            <span>{{ auth.currentUser()?.company_name || 'Merchant Enterprise' }}</span>
            <span class="text-xs font-normal text-slate-400 px-2.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 font-mono">LIVE CONSOLE</span>
          </h2>
          <p class="text-xs text-slate-400 mt-1 max-w-xl">
            Autonomous multi-entity collusion ring scoring with sub-millisecond point-in-time state evaluation.
          </p>
        </div>

        <div class="relative z-10 flex flex-wrap items-center gap-3">
          <div class="text-[11px] font-mono text-slate-400 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
            <lucide-icon name="activity" [size]="14" class="text-cyan-400 animate-pulse"></lucide-icon>
            <span>Telemetry synced {{ merchantService.secondsSinceLastUpdate() }}s ago</span>
          </div>

          <button
            type="button"
            (click)="refreshMetrics()"
            [disabled]="merchantService.isRefreshing()"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50 shadow-md"
          >
            <lucide-icon name="refresh-cw" [size]="13" [class.animate-spin]="merchantService.isRefreshing()"></lucide-icon>
            <span>Sync State</span>
          </button>

          <a
            routerLink="/app/risk-analyzer"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02]"
          >
            <lucide-icon name="zap" [size]="14" class="text-black"></lucide-icon>
            <span>Simulate Checkout</span>
          </a>
        </div>
      </div>

      <!-- ZERO DATA ONBOARDING BANNER (When new merchant has 0 transactions) -->
      <div *ngIf="isZeroData()" class="bg-[#0B132B]/80 border border-cyan-500/30 rounded-3xl p-10 text-center space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl animate-fade-in">
        <div class="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(6,182,212,0.2)]">
          <lucide-icon name="inbox" [size]="32"></lucide-icon>
        </div>

        <div class="max-w-md mx-auto">
          <h3 class="text-lg font-bold text-white tracking-tight">Zero Inbound Transactions Detected</h3>
          <p class="text-xs text-slate-400 mt-2 leading-relaxed">
            Your live merchant partition is provisioned and listening. Send your first live checkout event to activate real-time graph modeling and velocity scoring.
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            (click)="sendQuickSampleTx()"
            [disabled]="isSendingSample()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50"
          >
            <lucide-icon name="zap" [size]="14"></lucide-icon>
            <span>{{ isSendingSample() ? 'Executing Inference...' : 'Send Live Test Transaction' }}</span>
          </button>

          <a
            routerLink="/app/integration"
            class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all hover:border-slate-600"
          >
            Integration Gateway & Webhooks →
          </a>
        </div>
      </div>

      <!-- LIVE KPI METRIC CARDS -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Live Transactions -->
        <div class="p-5 rounded-2xl bg-[#0B132B]/80 border border-slate-800 hover:border-cyan-500/40 backdrop-blur-xl shadow-xl transition-all group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Total Volume</span>
            <span class="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">💳</span>
          </div>
          <div class="mt-3 text-2xl lg:text-3xl font-extrabold text-white font-mono tracking-tight group-hover:text-cyan-300 transition-colors">
            {{ metrics()?.total_transactions ?? 0 }}
          </div>
          <div class="mt-1 text-[11px] text-slate-500 font-mono truncate">
            Persisted in Aiven MySQL
          </div>
        </div>

        <!-- Approval Rate -->
        <div class="p-5 rounded-2xl bg-[#0B132B]/80 border border-slate-800 hover:border-emerald-500/40 backdrop-blur-xl shadow-xl transition-all group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Approval Rate</span>
            <span class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✅</span>
          </div>
          <div class="mt-3 text-2xl lg:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            {{ metrics()?.total_transactions ? ((metrics()?.approval_rate ?? 0) * 100).toFixed(1) + '%' : '0.0%' }}
          </div>
          <div class="mt-1 text-[11px] text-slate-500 font-mono">
            {{ metrics()?.approvals ?? 0 }} orders cleared
          </div>
        </div>

        <!-- Review Rate -->
        <div class="p-5 rounded-2xl bg-[#0B132B]/80 border border-slate-800 hover:border-amber-500/40 backdrop-blur-xl shadow-xl transition-all group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Review Rate</span>
            <span class="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">⚠️</span>
          </div>
          <div class="mt-3 text-2xl lg:text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
            {{ metrics()?.total_transactions ? ((metrics()?.review_rate ?? 0) * 100).toFixed(1) + '%' : '0.0%' }}
          </div>
          <div class="mt-1 text-[11px] text-slate-500 font-mono">
            {{ metrics()?.reviews ?? 0 }} step-up reviews
          </div>
        </div>

        <!-- Block Rate -->
        <div class="p-5 rounded-2xl bg-[#0B132B]/80 border border-slate-800 hover:border-rose-500/40 backdrop-blur-xl shadow-xl transition-all group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Block Rate</span>
            <span class="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">🛑</span>
          </div>
          <div class="mt-3 text-2xl lg:text-3xl font-extrabold text-rose-400 font-mono tracking-tight">
            {{ metrics()?.total_transactions ? ((metrics()?.block_rate ?? 0) * 100).toFixed(1) + '%' : '0.0%' }}
          </div>
          <div class="mt-1 text-[11px] text-slate-500 font-mono">
            {{ metrics()?.blocks ?? 0 }} syndicates blocked
          </div>
        </div>

        <!-- Mean Risk Score -->
        <div class="p-5 rounded-2xl bg-[#0B132B]/80 border border-slate-800 hover:border-indigo-500/40 backdrop-blur-xl shadow-xl transition-all group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Mean Risk Score</span>
            <span class="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">🛡️</span>
          </div>
          <div class="mt-3 text-2xl lg:text-3xl font-extrabold text-indigo-300 font-mono tracking-tight">
            {{ metrics()?.total_transactions ? ((metrics()?.average_risk_score ?? 0) * 100).toFixed(2) + '%' : '0.00%' }}
          </div>
          <div class="mt-1 text-[11px] text-slate-500 font-mono">
            GBDT model probability
          </div>
        </div>
      </div>

      <!-- RECENT LIVE TRANSACTIONS TERMINAL STREAM -->
      <div *ngIf="!isZeroData()" class="rounded-2xl bg-[#0B132B]/90 border border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in">
        <div class="p-5 border-b border-slate-800 flex items-center justify-between bg-[#080D1A]/50">
          <div>
            <h3 class="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Live Ingested Transactions</span>
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Real-time inference stream evaluated with point-in-time causality</p>
          </div>
          <a
            routerLink="/app/transactions"
            class="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>View Full Ledger</span>
            <lucide-icon name="arrow-right" [size]="13"></lucide-icon>
          </a>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#060A14]/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 font-mono text-[11px]">
              <tr>
                <th class="px-5 py-3.5">Transaction ID</th>
                <th class="px-5 py-3.5">User Identity</th>
                <th class="px-5 py-3.5">Gross Amount</th>
                <th class="px-5 py-3.5">Risk Score</th>
                <th class="px-5 py-3.5">Decision</th>
                <th class="px-5 py-3.5">Processed At</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 font-mono">
              <tr *ngFor="let tx of metrics()?.recent_transactions" class="hover:bg-cyan-500/[0.03] transition-colors">
                <td class="px-5 py-4 font-bold text-slate-100">
                  <a [routerLink]="['/app/transactions', tx.transaction_id]" class="hover:text-cyan-400 flex items-center gap-1.5">
                    <span>{{ tx.transaction_id }}</span>
                    <lucide-icon name="external-link" [size]="11" class="text-slate-500"></lucide-icon>
                  </a>
                </td>
                <td class="px-5 py-4 text-slate-300">{{ tx.user_id }}</td>
                <td class="px-5 py-4 text-slate-100 font-semibold">
                  {{ tx.currency || 'INR' }} {{ (tx.amount || 0).toFixed(2) }}
                </td>
                <td class="px-5 py-4 font-bold" [ngClass]="{
                  'text-rose-400 text-glow-crimson': tx.risk_score >= 0.90,
                  'text-amber-400': tx.risk_score >= 0.50 && tx.risk_score < 0.90,
                  'text-emerald-400 text-glow-emerald': tx.risk_score < 0.50
                }">
                  {{ ((tx.risk_score || 0) * 100).toFixed(2) }}%
                </td>
                <td class="px-5 py-4">
                  <app-decision-badge [decision]="tx.decision || 'APPROVE'"></app-decision-badge>
                </td>
                <td class="px-5 py-4 text-slate-400 font-sans text-[11px]">
                  {{ tx.timestamp | date:'medium' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class LiveOverviewComponent implements OnInit {
  auth = inject(AuthService);
  merchantService = inject(MerchantService);

  readonly metrics = this.merchantService.liveMetrics;
  readonly isZeroData = this.merchantService.isZeroData;
  readonly isSendingSample = signal(false);

  ngOnInit() {
    this.refreshMetrics();
  }

  refreshMetrics() {
    this.merchantService.getLiveMetrics().subscribe();
  }

  sendQuickSampleTx() {
    this.isSendingSample.set(true);
    const samplePayload = {
      transaction_id: `tx_live_${Date.now()}`,
      user_id: `usr_${Math.floor(1000 + Math.random() * 9000)}`,
      amount: 149.00,
      currency: 'INR',
      timestamp: new Date().toISOString(),
      product_category: 'electronics',
      device_id: 'dev_browser_live_01',
      ip_address: '198.51.100.45',
      payment_method_id: 'pm_card_live_01',
      email_domain: 'apexretail.com',
      is_promo_used: 0,
    };

    this.merchantService.evaluateLiveTransaction(samplePayload).subscribe({
      next: () => {
        this.isSendingSample.set(false);
      },
      error: () => {
        this.isSendingSample.set(false);
      },
    });
  }
}
