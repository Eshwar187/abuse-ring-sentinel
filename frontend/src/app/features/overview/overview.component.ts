import { Component, OnInit, inject, signal, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as echarts from 'echarts';
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
    MetricCardComponent,
    DecisionBadgeComponent,
  ],
  template: `
    <div class="space-y-6 font-sans">
      <!-- Live Merchant Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE MERCHANT
            </span>
            <span class="text-xs text-slate-400 font-medium">Tenant ID: {{ auth.currentUser()?.merchant_id }}</span>
          </div>
          <h2 class="text-xl font-bold text-white tracking-tight mt-1">
            {{ auth.currentUser()?.company_name || 'Merchant' }} — Live Risk Overview
          </h2>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <lucide-icon name="activity" [size]="12" class="text-emerald-400"></lucide-icon>
            <span>Updated {{ merchantService.secondsSinceLastUpdate() }}s ago</span>
          </div>

          <button
            type="button"
            (click)="refreshMetrics()"
            [disabled]="merchantService.isRefreshing()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
          >
            <lucide-icon name="refresh-cw" [size]="12" [class.animate-spin]="merchantService.isRefreshing()"></lucide-icon>
            <span>Refresh</span>
          </button>

          <a
            routerLink="/app/risk-analyzer"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all"
          >
            <lucide-icon name="zap" [size]="13"></lucide-icon>
            <span>Test Live Checkout</span>
          </a>
        </div>
      </div>

      <!-- ZERO DATA STATE BANNER (When merchant has 0 transactions) -->
      <div *ngIf="isZeroData()" class="bg-slate-900 border border-indigo-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl animate-fade-in">
        <div class="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <lucide-icon name="inbox" [size]="28"></lucide-icon>
        </div>

        <div class="max-w-md mx-auto">
          <h3 class="text-base font-bold text-white">Waiting for Your First Transaction</h3>
          <p class="text-xs text-slate-400 mt-1">
            Your live merchant account has 0 recorded transactions. 
            Connect your checkout flow or submit a test payload using the Live Risk Analyzer.
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            (click)="sendQuickSampleTx()"
            [disabled]="isSendingSample()"
            class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            <lucide-icon name="zap" [size]="14"></lucide-icon>
            <span>{{ isSendingSample() ? 'Sending Test Event...' : 'Send Live Test Transaction' }}</span>
          </button>

          <a
            routerLink="/app/integration"
            class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            View API Integration Docs
          </a>
        </div>
      </div>

      <!-- LIVE KPI METRIC CARDS -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <app-metric-card
          label="Live Transactions"
          [value]="metrics()?.total_transactions?.toString() ?? '0'"
          context="Runtime SQLite State Store"
        >
          <span icon>💳</span>
        </app-metric-card>

        <app-metric-card
          label="Approval Rate"
          [value]="metrics()?.total_transactions ? ((metrics()?.approval_rate ?? 0) * 100).toFixed(1) + '%' : '0.0%'"
          [context]="(metrics()?.approvals ?? 0) + ' orders approved'"
        >
          <span icon>✅</span>
        </app-metric-card>

        <app-metric-card
          label="Review Rate"
          [value]="metrics()?.total_transactions ? ((metrics()?.review_rate ?? 0) * 100).toFixed(1) + '%' : '0.0%'"
          [context]="(metrics()?.reviews ?? 0) + ' step-up cases'"
        >
          <span icon>⚠️</span>
        </app-metric-card>

        <app-metric-card
          label="Block Rate"
          [value]="metrics()?.total_transactions ? ((metrics()?.block_rate ?? 0) * 100).toFixed(1) + '%' : '0.0%'"
          [context]="(metrics()?.blocks ?? 0) + ' automated blocks'"
        >
          <span icon>🛑</span>
        </app-metric-card>

        <app-metric-card
          label="Average Risk"
          [value]="metrics()?.total_transactions ? ((metrics()?.average_risk_score ?? 0) * 100).toFixed(2) + '%' : '0.00%'"
          context="Mean probability score"
        >
          <span icon>🛡️</span>
        </app-metric-card>
      </div>

      <!-- RECENT LIVE TRANSACTIONS TABLE -->
      <div *ngIf="!isZeroData()" class="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden animate-fade-in">
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-white">Recent Live Transactions</h3>
            <p class="text-xs text-slate-400">Transactions processed in real-time by your isolated merchant engine</p>
          </div>
          <a
            routerLink="/app/transactions"
            class="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
          >
            <span>View All Live Transactions</span>
            <lucide-icon name="arrow-right" [size]="12"></lucide-icon>
          </a>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th class="px-4 py-3">Transaction ID</th>
                <th class="px-4 py-3">User ID</th>
                <th class="px-4 py-3">Amount</th>
                <th class="px-4 py-3">Risk Score</th>
                <th class="px-4 py-3">Decision</th>
                <th class="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 font-mono">
              <tr *ngFor="let tx of metrics()?.recent_transactions" class="hover:bg-slate-800/50 transition-colors">
                <td class="px-4 py-3 font-bold text-slate-200">
                  <a [routerLink]="['/app/transactions', tx.transaction_id]" class="hover:text-rose-400">
                    {{ tx.transaction_id }}
                  </a>
                </td>
                <td class="px-4 py-3 text-slate-300">{{ tx.user_id }}</td>
                <td class="px-4 py-3 text-slate-200">
                  {{ tx.currency || 'INR' }} {{ (tx.amount || 0).toFixed(2) }}
                </td>
                <td class="px-4 py-3 font-bold" [ngClass]="{
                  'text-rose-400': tx.risk_score >= 0.90,
                  'text-amber-400': tx.risk_score >= 0.50 && tx.risk_score < 0.90,
                  'text-emerald-400': tx.risk_score < 0.50
                }">
                  {{ ((tx.risk_score || 0) * 100).toFixed(2) }}%
                </td>
                <td class="px-4 py-3">
                  <app-decision-badge [decision]="tx.decision || 'APPROVE'"></app-decision-badge>
                </td>
                <td class="px-4 py-3 text-slate-400 font-sans text-[11px]">
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
