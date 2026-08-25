import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as echarts from 'echarts';
import {
  LucideAngularModule,
  AlertTriangle,
  ArrowRight,
  Shield,
  Zap,
  Activity,
  Layers,
  Database,
} from 'lucide-angular';

import { MetricCardComponent } from '../../shared/components/metric-card.component';
import { DecisionBadgeComponent } from '../../shared/components/decision-badge.component';
import { TransactionService } from '../../core/services/transaction.service';
import { TransactionListItem } from '../../core/models/risk.models';

@Component({
  selector: 'app-demo-mode',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    MetricCardComponent,
    DecisionBadgeComponent,
  ],
  template: `
    <div class="space-y-6 animate-fade-in pb-12 font-sans">
      <!-- Prominent Demo Environment Banner -->
      <div class="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div class="flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30 text-lg">
            ⚠️
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Demo Environment
              </span>
              <span class="text-xs font-bold text-amber-200">Historical Evaluation Benchmark Dataset</span>
            </div>
            <p class="text-xs text-slate-300 mt-1.5 leading-relaxed">
              You are viewing the pre-computed Phase 5 held-out evaluation dataset (N = 6,929 transactions). 
              This data demonstrates model efficacy and does not represent live merchant traffic.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <a
            routerLink="/app/overview"
            class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all"
          >
            <span>Switch to Live Merchant App</span>
            <lucide-icon name="arrow-right" [size]="14"></lucide-icon>
          </a>
        </div>
      </div>

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight">Benchmark Risk Evaluation (Phase 5 Held-Out Set)</h2>
          <p class="text-xs text-slate-400 mt-1">
            Offline audited performance of Model F (HistGradientBoosting + Graph + Behavioral Features) against coordinated Sybil attacks.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <a
            routerLink="/app/risk-analyzer"
            class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <lucide-icon name="zap" [size]="13" class="text-rose-400"></lucide-icon>
            <span>Live Risk Analyzer Studio</span>
          </a>
        </div>
      </div>

      <!-- 5 Benchmark KPI Metrics -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <app-metric-card
          label="Transactions Evaluated"
          value="6,929"
          context="Held-out evaluation window"
        >
          <span icon>💳</span>
        </app-metric-card>

        <app-metric-card
          label="Approval Rate"
          value="99.11%"
          context="6,867 orders authorized"
        >
          <span icon>✅</span>
        </app-metric-card>

        <app-metric-card
          label="Review Rate"
          value="0.20%"
          context="14 step-up 2FA cases"
        >
          <span icon>⚠️</span>
        </app-metric-card>

        <app-metric-card
          label="Block Rate"
          value="0.69%"
          context="48 automated declines"
        >
          <span icon>🛑</span>
        </app-metric-card>

        <app-metric-card
          label="Abuse Intercepted"
          value="100.0%"
          context="43 of 43 attacks blocked"
        >
          <span icon>🛡️</span>
        </app-metric-card>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Distribution Histogram (2 cols) -->
        <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-white">Risk Score Separation (Benchmark)</h3>
              <p class="text-xs text-slate-400">Distribution of probabilistic model risk scores across held-out transactions</p>
            </div>
            <div class="flex items-center gap-2 text-xs font-mono">
              <span class="flex items-center gap-1 text-emerald-400 font-semibold"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Low (&lt;0.50)</span>
              <span class="flex items-center gap-1 text-amber-400 font-semibold"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Review</span>
              <span class="flex items-center gap-1 text-rose-400 font-semibold"><span class="w-2 h-2 rounded-full bg-rose-500"></span> Block (≥0.90)</span>
            </div>
          </div>
          <div #distributionChart class="w-full h-64 min-h-[260px]"></div>
        </div>

        <!-- Policy Decision Breakdown (1 col) -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div class="mb-4">
            <h3 class="text-sm font-bold text-white">Policy Decision Breakdown</h3>
            <p class="text-xs text-slate-400">Action split under fixed threshold τ* = 0.90</p>
          </div>
          <div #decisionChart class="w-full h-64 min-h-[260px]"></div>
        </div>
      </div>

      <!-- Benchmark Sample Transactions Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-white">Historical Benchmark Transactions (Sample)</h3>
            <p class="text-xs text-slate-400">Audited transactions demonstrating single-account velocity vs multi-account graph collusion</p>
          </div>
          <span class="text-xs font-mono text-slate-400">Showing {{ sampleTransactions.length }} Curated Cases</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th class="px-4 py-3">Transaction ID</th>
                <th class="px-4 py-3">User ID</th>
                <th class="px-4 py-3">Amount</th>
                <th class="px-4 py-3">Risk Score</th>
                <th class="px-4 py-3">Policy Action</th>
                <th class="px-4 py-3">Primary Trigger</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 font-mono">
              @for (tx of sampleTransactions; track tx.transaction_id) {
                <tr class="hover:bg-slate-800/50 transition-colors">
                  <td class="px-4 py-3 text-slate-100 font-bold">{{ tx.transaction_id }}</td>
                  <td class="px-4 py-3 text-slate-300">{{ tx.user_id }}</td>
                  <td class="px-4 py-3 text-slate-200">₹{{ tx.amount.toFixed(2) }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="font-bold"
                      [ngClass]="{
                        'text-rose-400': tx.risk_score >= 0.90,
                        'text-amber-400': tx.risk_score >= 0.50 && tx.risk_score < 0.90,
                        'text-emerald-400': tx.risk_score < 0.50
                      }"
                    >
                      {{ (tx.risk_score * 100).toFixed(2) }}%
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <app-decision-badge [decision]="tx.decision"></app-decision-badge>
                  </td>
                  <td class="px-4 py-3 font-sans text-slate-300 text-[11px]">{{ tx.primary_reason }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class DemoComponent implements OnInit, AfterViewInit, OnDestroy {
  private txService = inject(TransactionService);

  @ViewChild('distributionChart') distributionChartRef!: ElementRef;
  @ViewChild('decisionChart') decisionChartRef!: ElementRef;

  private distChartInstance?: echarts.ECharts;
  private decChartInstance?: echarts.ECharts;
  private resizeHandler = () => {
    this.distChartInstance?.resize();
    this.decChartInstance?.resize();
  };

  sampleTransactions: TransactionListItem[] = [
    {
      transaction_id: 'tx_0027436',
      timestamp: '2026-03-16T03:14:22Z',
      amount: 249.99,
      product_category: 'electronics',
      risk_score: 1.0000,
      risk_level: 'HIGH',
      decision: 'BLOCK',
      primary_reason: 'NEW_ACCOUNT + GRAPH_CONNECTED_USERS',
      user_id: 'usr_004812',
      is_promo_used: 1,
      connected_users: 8,
    },
    {
      transaction_id: 'tx_0027410',
      timestamp: '2026-03-16T02:48:10Z',
      amount: 189.50,
      product_category: 'electronics',
      risk_score: 0.9998,
      risk_level: 'HIGH',
      decision: 'BLOCK',
      primary_reason: 'GRAPH_SHARED_DEVICE + GRAPH_SHARED_PAYMENT',
      user_id: 'usr_004809',
      is_promo_used: 1,
      connected_users: 7,
    },
    {
      transaction_id: 'tx_0014738',
      timestamp: '2026-03-02T19:40:15Z',
      amount: 135.00,
      product_category: 'beauty',
      risk_score: 0.6210,
      risk_level: 'MEDIUM',
      decision: 'REVIEW',
      primary_reason: 'NEW_ACCOUNT + PROMO_ACTIVITY',
      user_id: 'usr_003890',
      is_promo_used: 1,
      connected_users: 1,
    },
    {
      transaction_id: 'tx_0001045',
      timestamp: '2026-01-20T14:22:00Z',
      amount: 45.00,
      product_category: 'groceries',
      risk_score: 0.0012,
      risk_level: 'LOW',
      decision: 'APPROVE',
      primary_reason: 'LOW_RISK_ESTABLISHED_ACCOUNT',
      user_id: 'usr_001004',
      is_promo_used: 0,
      connected_users: 1,
    },
    {
      transaction_id: 'tx_0005822',
      timestamp: '2026-02-11T11:05:30Z',
      amount: 89.90,
      product_category: 'fashion',
      risk_score: 0.0034,
      risk_level: 'LOW',
      decision: 'APPROVE',
      primary_reason: 'LOW_RISK_ESTABLISHED_ACCOUNT',
      user_id: 'usr_002340',
      is_promo_used: 0,
      connected_users: 1,
    },
  ];

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => {
      try {
        this.initDistributionChart();
        this.initDecisionChart();
        window.addEventListener('resize', this.resizeHandler);
      } catch (e) {
        console.error('ECharts init error:', e);
      }
    }, 100);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
    this.distChartInstance?.dispose();
    this.decChartInstance?.dispose();
  }

  private initDistributionChart() {
    if (!this.distributionChartRef?.nativeElement) return;
    this.distChartInstance = echarts.init(this.distributionChartRef.nativeElement);

    const bins = ['0.0-0.1', '0.1-0.2', '0.2-0.3', '0.3-0.4', '0.4-0.5', '0.5-0.6', '0.6-0.7', '0.7-0.8', '0.8-0.9', '0.9-1.0'];
    const counts = [6795, 48, 12, 8, 4, 3, 5, 6, 8, 48];

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: bins,
        axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 30 },
        axisLine: { lineStyle: { color: '#334155' } },
      },
      yAxis: {
        type: 'log',
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      series: [
        {
          name: 'Count',
          type: 'bar',
          data: counts.map((val, idx) => ({
            value: val,
            itemStyle: {
              color: idx === 9 ? '#f43f5e' : idx >= 5 ? '#f59e0b' : '#10b981',
              borderRadius: [4, 4, 0, 0],
            },
          })),
        },
      ],
    };

    this.distChartInstance.setOption(option);
  }

  private initDecisionChart() {
    if (!this.decisionChartRef?.nativeElement) return;
    this.decChartInstance = echarts.init(this.decisionChartRef.nativeElement);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc' },
      },
      series: [
        {
          name: 'Decisions',
          type: 'pie',
          radius: ['50%', '75%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 6, borderColor: '#0f172a', borderWidth: 2 },
          label: { show: false },
          data: [
            { value: 6867, name: 'APPROVE (99.11%)', itemStyle: { color: '#10b981' } },
            { value: 14, name: 'REVIEW (0.20%)', itemStyle: { color: '#f59e0b' } },
            { value: 48, name: 'BLOCK (0.69%)', itemStyle: { color: '#f43f5e' } },
          ],
        },
      ],
    };

    this.decChartInstance.setOption(option);
  }
}
