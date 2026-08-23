import { Component, OnInit, ElementRef, ViewChild, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts';
import { MetricCardComponent } from '../../shared/components/metric-card.component';
import { HealthService } from '../../core/services/health.service';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [CommonModule, MetricCardComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-surface-900 tracking-tight">System & Operational Monitoring</h2>
          <p class="text-xs text-surface-500 mt-1">
            Real-time API telemetry, live inference metrics, and model governance specifications.
          </p>
        </div>
        <button
          type="button"
          (click)="refreshLiveMetrics()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-surface-700 text-xs font-semibold rounded-md transition-colors"
        >
          <span>🔄 Refresh Telemetry</span>
        </button>
      </div>

      <!-- Live Session Telemetry (From GET /metrics/summary) -->
      <div class="bg-white border border-surface-200 rounded-lg p-5 shadow-card space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-surface-200">
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-surface-800 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live API Session Telemetry (GET /metrics/summary)
            </h3>
            <p class="text-[11px] text-surface-500 mt-0.5">Real-time metrics computed directly from active inference traffic</p>
          </div>
          <span class="text-[10px] font-mono text-surface-400">
            Environment: {{ metricsData?.server_environment || 'active' }}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div class="p-3 bg-surface-50 rounded border border-surface-200">
            <div class="text-[10px] font-bold text-surface-500 uppercase">Live Requests</div>
            <div class="text-lg font-bold font-mono text-surface-900 mt-0.5">
              {{ metricsData?.total_inference_requests ?? 0 }}
            </div>
          </div>
          <div class="p-3 bg-emerald-50 rounded border border-emerald-200">
            <div class="text-[10px] font-bold text-emerald-800 uppercase">Live Approvals</div>
            <div class="text-lg font-bold font-mono text-emerald-700 mt-0.5">
              {{ metricsData?.decision_breakdown?.approvals ?? 0 }}
            </div>
          </div>
          <div class="p-3 bg-amber-50 rounded border border-amber-200">
            <div class="text-[10px] font-bold text-amber-800 uppercase">Live Reviews</div>
            <div class="text-lg font-bold font-mono text-amber-700 mt-0.5">
              {{ metricsData?.decision_breakdown?.reviews ?? 0 }}
            </div>
          </div>
          <div class="p-3 bg-rose-50 rounded border border-rose-200">
            <div class="text-[10px] font-bold text-rose-800 uppercase">Live Blocks</div>
            <div class="text-lg font-bold font-mono text-rose-700 mt-0.5">
              {{ metricsData?.decision_breakdown?.blocks ?? 0 }}
            </div>
          </div>
          <div class="p-3 bg-surface-50 rounded border border-surface-200">
            <div class="text-[10px] font-bold text-surface-500 uppercase">Avg Latency</div>
            <div class="text-lg font-bold font-mono text-surface-900 mt-0.5">
              {{ metricsData?.performance?.avg_latency_ms ? metricsData?.performance?.avg_latency_ms + ' ms' : '—' }}
            </div>
          </div>
          <div class="p-3 bg-surface-50 rounded border border-surface-200">
            <div class="text-[10px] font-bold text-surface-500 uppercase">P95 Latency</div>
            <div class="text-lg font-bold font-mono text-surface-900 mt-0.5">
              {{ metricsData?.performance?.p95_latency_ms ? metricsData?.performance?.p95_latency_ms + ' ms' : '—' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Historical Reference Benchmark Cards (From Phase 5 Held-Out Study) -->
      <div>
        <div class="text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
          Frozen Benchmark Performance Reference (N = 6,929 Held-Out Test Set)
        </div>
        <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
          <app-metric-card label="Total Evaluated" value="6,929" context="Held-out test set"></app-metric-card>
          <app-metric-card label="Approval Rate" value="99.11%" context="6,867 orders"></app-metric-card>
          <app-metric-card label="Review Rate" value="0.20%" context="14 orders (2FA)"></app-metric-card>
          <app-metric-card label="Block Rate" value="0.69%" context="48 orders"></app-metric-card>
          <app-metric-card label="Abuse Recall" value="100.00%" context="43 of 43 attacks"></app-metric-card>
          <app-metric-card label="Precision @ 0.90" value="89.58%" context="43 TP / 48 blocked"></app-metric-card>
        </div>
      </div>

      <!-- Model Specifications & Governance -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Model Registry Info (1 col) -->
        <div class="bg-white border border-surface-200 rounded-lg p-5 shadow-card space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-surface-200">
            <h3 class="text-xs font-bold uppercase tracking-wider text-surface-800">Frozen Model Registry</h3>
            <span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono rounded">
              PRODUCTION ACTIVE
            </span>
          </div>

          <div class="space-y-2 text-xs font-mono">
            <div class="flex justify-between py-1 border-b border-surface-100">
              <span class="text-surface-500">Model Name:</span>
              <span class="font-bold text-surface-900">abuse_ring_sentinel</span>
            </div>
            <div class="flex justify-between py-1 border-b border-surface-100">
              <span class="text-surface-500">Algorithm:</span>
              <span class="font-bold text-surface-900">HistGradientBoosting</span>
            </div>
            <div class="flex justify-between py-1 border-b border-surface-100">
              <span class="text-surface-500">Model Version:</span>
              <span class="text-surface-800">phase3-v1</span>
            </div>
            <div class="flex justify-between py-1 border-b border-surface-100">
              <span class="text-surface-500">Feature Version:</span>
              <span class="text-surface-800">features-v2 (33 Feats)</span>
            </div>
            <div class="flex justify-between py-1 border-b border-surface-100">
              <span class="text-surface-500">Policy Version:</span>
              <span class="text-surface-800">val-opt-v1</span>
            </div>
            <div class="flex justify-between py-1 border-b border-surface-100">
              <span class="text-surface-500">Production Threshold:</span>
              <span class="font-bold text-rose-600">tau = 0.90</span>
            </div>
            <div class="flex justify-between py-1 border-b border-surface-100">
              <span class="text-surface-500">Benchmark Recall:</span>
              <span class="font-bold text-emerald-700">100.00%</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-surface-500">Benchmark Precision:</span>
              <span class="font-bold text-emerald-700">89.58%</span>
            </div>
          </div>
        </div>

        <!-- Operational Time Series Chart (2 cols) -->
        <div class="lg:col-span-2 bg-white border border-surface-200 rounded-lg p-5 shadow-card">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-surface-900">4-Slice Temporal Stability (Held-Out Window)</h3>
              <p class="text-xs text-surface-500">Validation of low false alarm rate across chronological slices</p>
            </div>
          </div>
          <div #timeChart class="w-full h-56"></div>
        </div>
      </div>
    </div>
  `,
})
export class MonitoringComponent implements OnInit, OnDestroy {
  @ViewChild('timeChart', { static: true }) timeChartRef!: ElementRef;
  private healthService = inject(HealthService);
  private timeChartInstance?: echarts.ECharts;

  get metricsData() {
    return this.healthService.metricsState().data;
  }

  ngOnInit(): void {
    this.refreshLiveMetrics();
    setTimeout(() => this.initChart(), 50);
  }

  ngOnDestroy(): void {
    this.timeChartInstance?.dispose();
  }

  refreshLiveMetrics(): void {
    this.healthService.fetchMetrics().subscribe();
  }

  private initChart() {
    if (this.timeChartRef) {
      this.timeChartInstance = echarts.init(this.timeChartRef.nativeElement);
      this.timeChartInstance.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['Transactions', 'Abuse Blocked (TP)', 'False Alarms (FP)'], textStyle: { fontSize: 10, color: '#64748B' } },
        grid: { top: '15%', left: '3%', right: '3%', bottom: '8%', containLabel: true },
        xAxis: {
          type: 'category',
          data: ['Mar 16-18', 'Mar 19-22', 'Mar 23-26', 'Mar 27-31'],
          axisLine: { lineStyle: { color: '#CBD5E1' } },
          axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'monospace' },
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#CBD5E1' } },
          axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'monospace' },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
        },
        series: [
          {
            name: 'Transactions',
            type: 'bar',
            data: [1328, 1731, 1749, 2121],
            itemStyle: { color: '#CBD5E1' },
            barWidth: '35%',
          },
          {
            name: 'Abuse Blocked (TP)',
            type: 'line',
            data: [43, 0, 0, 0],
            itemStyle: { color: '#EF4444' },
            lineStyle: { width: 3 },
            symbolSize: 8,
          },
          {
            name: 'False Alarms (FP)',
            type: 'line',
            data: [1, 1, 2, 1],
            itemStyle: { color: '#F59E0B' },
            lineStyle: { width: 2, type: 'dashed' },
            symbolSize: 6,
          },
        ],
      });

      window.addEventListener('resize', () => {
        this.timeChartInstance?.resize();
      });
    }
  }
}
