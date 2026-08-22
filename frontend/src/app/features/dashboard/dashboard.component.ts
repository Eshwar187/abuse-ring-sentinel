import { Component, OnInit, ElementRef, ViewChild, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as echarts from 'echarts';

import { MetricCardComponent } from '../../shared/components/metric-card.component';
import { RiskBadgeComponent } from '../../shared/components/risk-badge.component';
import { DecisionBadgeComponent } from '../../shared/components/decision-badge.component';
import { ScoreMeterComponent } from '../../shared/components/score-meter.component';
import { TransactionService } from '../../core/services/transaction.service';
import { TransactionListItem } from '../../core/models/risk.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MetricCardComponent,
    RiskBadgeComponent,
    DecisionBadgeComponent,
    ScoreMeterComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-surface-900 tracking-tight">Risk Overview</h2>
          <p class="text-xs text-surface-500 mt-1">
            Real-time visibility into merchant transaction risk, policy decisions, and coordinated multi-account collusion.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a
            routerLink="/risk-analyzer"
            class="inline-flex items-center gap-2 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
          >
            <span>⚡ Test Live Analyzer</span>
          </a>
        </div>
      </div>

      <!-- 5 High-Quality KPI Metrics -->
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
        <div class="lg:col-span-2 bg-white border border-surface-200 rounded-lg p-5 shadow-card">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-surface-900">Risk Score Separation</h3>
              <p class="text-xs text-surface-500">Distribution of probabilistic model risk scores across transactions</p>
            </div>
            <div class="flex items-center gap-2 text-xs font-mono">
              <span class="flex items-center gap-1 text-emerald-700 font-semibold"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Low (<0.50)</span>
              <span class="flex items-center gap-1 text-amber-700 font-semibold"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Review</span>
              <span class="flex items-center gap-1 text-rose-700 font-semibold"><span class="w-2 h-2 rounded-full bg-rose-500"></span> Block (≥0.90)</span>
            </div>
          </div>
          <div #distChart class="w-full h-64"></div>
        </div>

        <!-- Decision Breakdown Donut (1 col) -->
        <div class="bg-white border border-surface-200 rounded-lg p-5 shadow-card flex flex-col">
          <div class="mb-2">
            <h3 class="text-sm font-bold text-surface-900">Decision Breakdown</h3>
            <p class="text-xs text-surface-500">Policy enforcement distribution</p>
          </div>
          <div #donutChart class="w-full h-44 flex-shrink-0"></div>
          <div class="mt-2 pt-3 border-t border-surface-100 grid grid-cols-3 gap-2 text-center">
            <div class="p-2 bg-emerald-50 rounded border border-emerald-100">
              <div class="text-[10px] font-bold text-emerald-800 uppercase">APPROVE</div>
              <div class="text-sm font-bold font-mono text-emerald-700">6,867</div>
              <div class="text-[10px] text-emerald-600">99.11%</div>
            </div>
            <div class="p-2 bg-amber-50 rounded border border-amber-100">
              <div class="text-[10px] font-bold text-amber-800 uppercase">REVIEW</div>
              <div class="text-sm font-bold font-mono text-amber-700">14</div>
              <div class="text-[10px] text-amber-600">0.20%</div>
            </div>
            <div class="p-2 bg-rose-50 rounded border border-rose-100">
              <div class="text-[10px] font-bold text-rose-800 uppercase">BLOCK</div>
              <div class="text-sm font-bold font-mono text-rose-700">48</div>
              <div class="text-[10px] text-rose-600">0.69%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- High-Risk Activity & Observable Signals Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Recent High-Risk Events (2 cols) -->
        <div class="lg:col-span-2 bg-white border border-surface-200 rounded-lg p-5 shadow-card">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-surface-900">Recent High-Risk Transactions</h3>
              <p class="text-xs text-surface-500">Flagged attacks with active reason evidence</p>
            </div>
            <a routerLink="/transactions" class="text-xs text-brand-600 font-semibold hover:underline">View all →</a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-surface-200 text-surface-400 font-bold uppercase tracking-wider text-[10px]">
                  <th class="pb-2.5 font-semibold">Transaction ID</th>
                  <th class="pb-2.5 font-semibold">Timestamp</th>
                  <th class="pb-2.5 font-semibold">Amount</th>
                  <th class="pb-2.5 font-semibold">Risk Score</th>
                  <th class="pb-2.5 font-semibold">Decision</th>
                  <th class="pb-2.5 font-semibold">Primary Reason</th>
                  <th class="pb-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-100">
                @for (tx of highRiskTransactions; track tx.transaction_id) {
                  <tr class="hover:bg-surface-50 transition-colors">
                    <td class="py-3 font-mono font-semibold text-surface-900">{{ tx.transaction_id }}</td>
                    <td class="py-3 font-mono text-surface-500 text-[11px]">{{ tx.timestamp | date:'shortTime' }}</td>
                    <td class="py-3 font-mono font-medium text-surface-800">\${{ tx.amount.toFixed(2) }}</td>
                    <td class="py-3">
                      <app-score-meter [score]="tx.risk_score"></app-score-meter>
                    </td>
                    <td class="py-3">
                      <app-decision-badge [decision]="tx.decision"></app-decision-badge>
                    </td>
                    <td class="py-3 font-medium text-surface-700 truncate max-w-[200px]" [title]="tx.primary_reason">
                      {{ tx.primary_reason }}
                    </td>
                    <td class="py-3 text-right">
                      <a
                        [routerLink]="['/transactions', tx.transaction_id]"
                        class="px-2 py-1 bg-surface-100 hover:bg-surface-200 text-surface-700 font-semibold rounded text-[11px] transition-colors"
                      >
                        Inspect
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Strongest Observable Risk Signals (1 col) -->
        <div class="bg-white border border-surface-200 rounded-lg p-5 shadow-card">
          <h3 class="text-sm font-bold text-surface-900 mb-1">Key Observable Risk Signals</h3>
          <p class="text-xs text-surface-500 mb-4">Top feature triggers driving merchant decisions</p>

          <div class="space-y-3">
            <div class="p-3 bg-surface-50 rounded-lg border border-surface-200">
              <div class="flex items-center justify-between text-xs font-semibold text-surface-800">
                <span>🔗 Graph Connectivity</span>
                <span class="text-brand-600 font-mono font-bold">High Weight</span>
              </div>
              <p class="text-[11px] text-surface-500 mt-1">
                Accounts sharing 2+ devices or payment instruments in the incremental bipartite graph.
              </p>
            </div>

            <div class="p-3 bg-surface-50 rounded-lg border border-surface-200">
              <div class="flex items-center justify-between text-xs font-semibold text-surface-800">
                <span>⚡ 24h Burst Velocity</span>
                <span class="text-brand-600 font-mono font-bold">High Weight</span>
              </div>
              <p class="text-[11px] text-surface-500 mt-1">
                Multiple transactions within a short rolling window from brand new user profiles.
              </p>
            </div>

            <div class="p-3 bg-surface-50 rounded-lg border border-surface-200">
              <div class="flex items-center justify-between text-xs font-semibold text-surface-800">
                <span>⏱️ Account Age Shortcut</span>
                <span class="text-surface-600 font-mono font-bold">Medium Weight</span>
              </div>
              <p class="text-[11px] text-surface-500 mt-1">
                Account creation timestamp < 24h before first checkout.
              </p>
            </div>

            <div class="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div class="flex items-center justify-between text-xs font-semibold text-emerald-900">
                <span>🏡 Household Safe Isolation</span>
                <span class="text-emerald-700 font-mono font-bold">0 False Alarms</span>
              </div>
              <p class="text-[11px] text-emerald-700 mt-1">
                Shared addresses and residential Wi-Fi without device rotation are verified as benign.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('distChart', { static: true }) distChartRef!: ElementRef;
  @ViewChild('donutChart', { static: true }) donutChartRef!: ElementRef;

  private txService = inject(TransactionService);
  private distChartInstance?: echarts.ECharts;
  private donutChartInstance?: echarts.ECharts;

  highRiskTransactions: TransactionListItem[] = [];

  ngOnInit(): void {
    this.highRiskTransactions = this.txService.getTransactions().slice(0, 5);
    setTimeout(() => this.initCharts(), 50);
  }

  ngOnDestroy(): void {
    this.distChartInstance?.dispose();
    this.donutChartInstance?.dispose();
  }

  private initCharts() {
    // 1. Risk Score Distribution
    if (this.distChartRef) {
      this.distChartInstance = echarts.init(this.distChartRef.nativeElement);
      this.distChartInstance.setOption({
        tooltip: { trigger: 'axis' },
        grid: { top: '12%', left: '3%', right: '3%', bottom: '8%', containLabel: true },
        xAxis: {
          type: 'category',
          data: ['0.0-0.1', '0.1-0.2', '0.2-0.3', '0.3-0.4', '0.4-0.5', '0.5-0.6', '0.6-0.7', '0.7-0.8', '0.8-0.9', '0.9-1.0'],
          axisLine: { lineStyle: { color: '#CBD5E1' } },
          axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'monospace' },
        },
        yAxis: {
          type: 'log',
          axisLine: { lineStyle: { color: '#CBD5E1' } },
          axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'monospace' },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
        },
        series: [
          {
            name: 'Transaction Count',
            type: 'bar',
            data: [
              { value: 6867, itemStyle: { color: '#10B981' } },
              { value: 2, itemStyle: { color: '#10B981' } },
              { value: 1, itemStyle: { color: '#10B981' } },
              { value: 2, itemStyle: { color: '#10B981' } },
              { value: 3, itemStyle: { color: '#10B981' } },
              { value: 3, itemStyle: { color: '#F59E0B' } },
              { value: 1, itemStyle: { color: '#F59E0B' } },
              { value: 1, itemStyle: { color: '#F59E0B' } },
              { value: 1, itemStyle: { color: '#F59E0B' } },
              { value: 48, itemStyle: { color: '#EF4444' } },
            ],
            barWidth: '60%',
            borderRadius: [4, 4, 0, 0],
          },
        ],
      });
    }

    // 2. Decision Donut Chart
    if (this.donutChartRef) {
      this.donutChartInstance = echarts.init(this.donutChartRef.nativeElement);
      this.donutChartInstance.setOption({
        tooltip: { trigger: 'item' },
        legend: { show: false },
        series: [
          {
            name: 'Decision',
            type: 'pie',
            radius: ['60%', '85%'],
            avoidLabelOverlap: false,
            label: { show: false },
            data: [
              { value: 6867, name: 'APPROVE', itemStyle: { color: '#10B981' } },
              { value: 14, name: 'REVIEW', itemStyle: { color: '#F59E0B' } },
              { value: 48, name: 'BLOCK', itemStyle: { color: '#EF4444' } },
            ],
          },
        ],
      });
    }

    window.addEventListener('resize', () => {
      this.distChartInstance?.resize();
      this.donutChartInstance?.resize();
    });
  }
}
