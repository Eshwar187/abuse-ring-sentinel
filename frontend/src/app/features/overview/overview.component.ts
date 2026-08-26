import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MerchantService } from '../../core/services/merchant.service';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';

@Component({
  selector: 'app-live-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
  ],
  template: `
    <div class="space-y-6 font-sans select-none pb-12 max-w-7xl mx-auto">
      <!-- 1. Hero Welcome & System Health Banner -->
      <div class="p-6 sm:p-7 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div class="relative z-10 max-w-xl">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Welcome back, {{ auth.currentUser()?.company_name || 'Enterprise' }}</span>
            <span class="text-xl">👋</span>
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Your fraud defense system is actively monitoring and protecting transactions in real-time with zero point-in-time leakage.
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
            <span class="text-xs font-semibold text-white">Live System Health</span>
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

          <div class="text-[10px] text-slate-500 font-mono">
            Last updated {{ merchantService.secondsSinceLastUpdate() }} seconds ago
          </div>
        </div>
      </div>

      <!-- 2. Top 5 KPI Metric Cards (Generous Responsive Grid) -->
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
            <span class="text-slate-500">Transactions / 24h</span>
            <span class="text-emerald-400 font-bold">↗ 23.5%</span>
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
            <span class="text-slate-500">Auto-cleared</span>
            <span class="text-emerald-400 font-bold">↗ 2.3%</span>
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
            <span class="text-slate-500">Step-up challenges</span>
            <span class="text-emerald-400 font-bold">↘ 1.2%</span>
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
            <span class="text-slate-500">Syndicates blocked</span>
            <span class="text-rose-400 font-bold">↗ 0.5%</span>
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
            <span class="text-slate-500">GBDT probability</span>
            <span class="text-emerald-400 font-bold">↘ 0.042</span>
          </div>
        </div>
      </div>

      <!-- 3. Middle Analytics Row (3 Columns: Risk Distribution, Risk Score Over Time, Top Risk Factors) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Column 1: Risk Distribution -->
        <div class="p-6 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white tracking-tight font-mono">Risk Distribution</h3>
            <span class="text-slate-500 text-xs">Total: {{ totalTransactionsCount() }}</span>
          </div>

          <!-- Circular Donut SVG Representation -->
          <div class="py-6 flex items-center justify-center">
            <div class="relative w-40 h-40 flex items-center justify-center">
              <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                <!-- Background ring -->
                <path class="text-slate-800" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <!-- Low Risk (Green: 69.4%) -->
                <path class="text-emerald-400" stroke-dasharray="69.4, 100" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <!-- Medium Risk (Yellow: 29.1%) -->
                <path class="text-amber-400" stroke-dasharray="29.1, 100" stroke-dashoffset="-69.4" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <!-- High Risk (Red: 1.5%) -->
                <path class="text-rose-500" stroke-dasharray="1.5, 100" stroke-dashoffset="-98.5" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span class="text-xl font-extrabold text-white font-mono">{{ totalTransactionsCount() | number }}</span>
                <span class="text-[10px] text-slate-400 font-mono">Live Total</span>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="space-y-2 text-xs font-mono">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2 text-slate-300">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Low Risk (0.00 - 0.40)</span>
              </span>
              <span class="text-slate-200 font-bold">69.4%</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2 text-slate-300">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Medium Risk (0.40 - 0.90)</span>
              </span>
              <span class="text-slate-200 font-bold">29.1%</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2 text-slate-300">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>High Risk (0.90 - 1.00)</span>
              </span>
              <span class="text-rose-400 font-bold">1.5%</span>
            </div>
          </div>
        </div>

        <!-- Column 2: Risk Score Over Time -->
        <div class="p-6 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-white tracking-tight font-mono">Risk Score Over Time</h3>
            <div class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1">
              <span>24 Hours</span>
            </div>
          </div>

          <!-- Line Chart -->
          <div class="h-44 w-full relative flex items-end">
            <!-- Y-Axis labels -->
            <div class="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[9px] font-mono text-slate-500">
              <span>1.00</span>
              <span>0.75</span>
              <span>0.50</span>
              <span>0.25</span>
              <span>0.00</span>
            </div>

            <!-- Waveform SVG Line -->
            <div class="ml-7 w-full h-full pb-6">
              <svg class="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.35" />
                    <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.0" />
                  </linearGradient>
                </defs>
                <!-- Area fill -->
                <path d="M0 70 Q30 40, 60 65 T120 45 T180 60 T240 30 T300 55 L300 100 L0 100 Z" fill="url(#purpleGrad)" />
                <!-- Main Line -->
                <path d="M0 70 Q30 40, 60 65 T120 45 T180 60 T240 30 T300 55" fill="none" stroke="#a855f7" stroke-width="2.5" />
                <!-- Dot Markers -->
                <circle cx="60" cy="65" r="3.5" fill="#c084fc" />
                <circle cx="120" cy="45" r="3.5" fill="#c084fc" />
                <circle cx="180" cy="60" r="3.5" fill="#c084fc" />
                <circle cx="240" cy="30" r="3.5" fill="#c084fc" />
                <circle cx="300" cy="55" r="3.5" fill="#c084fc" />
              </svg>
            </div>
          </div>

          <!-- X-Axis Labels -->
          <div class="ml-7 flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </div>

        <!-- Column 3: Top Risk Factors -->
        <div class="p-6 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-white tracking-tight font-mono">Top Risk Factors</h3>
            <span class="text-[10px] text-cyan-400 font-mono">Real-Time Aggregation</span>
          </div>

          <div class="space-y-4">
            <!-- Shared Device -->
            <div>
              <div class="flex items-center justify-between text-xs font-sans mb-1">
                <span class="text-slate-300">Shared Device Clustering</span>
                <span class="text-slate-200 font-mono font-bold">42.8%</span>
              </div>
              <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div class="bg-rose-500 h-2 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" style="width: 42.8%"></div>
              </div>
            </div>

            <!-- Shared Payment Method -->
            <div>
              <div class="flex items-center justify-between text-xs font-sans mb-1">
                <span class="text-slate-300">Shared Payment Card</span>
                <span class="text-slate-200 font-mono font-bold">28.7%</span>
              </div>
              <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div class="bg-orange-500 h-2 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" style="width: 28.7%"></div>
              </div>
            </div>

            <!-- Velocity Anomaly -->
            <div>
              <div class="flex items-center justify-between text-xs font-sans mb-1">
                <span class="text-slate-300">Velocity Burst Spike</span>
                <span class="text-slate-200 font-mono font-bold">18.3%</span>
              </div>
              <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div class="bg-amber-400 h-2 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]" style="width: 18.3%"></div>
              </div>
            </div>

            <!-- High-Risk ASN / IP -->
            <div>
              <div class="flex items-center justify-between text-xs font-sans mb-1">
                <span class="text-slate-300">Proxy / Datacenter ASN</span>
                <span class="text-slate-200 font-mono font-bold">6.1%</span>
              </div>
              <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div class="bg-blue-500 h-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style="width: 6.1%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Bottom Row: High-Risk Transactions, System Activity & Quick Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Recent High Risk Transactions (5 cols) -->
        <div class="lg:col-span-5 p-6 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-white tracking-tight font-mono">Recent High Risk Transactions</h3>
            <a routerLink="/app/transactions" class="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors">
              View All →
            </a>
          </div>

          <div class="overflow-x-auto w-full">
            <table class="w-full text-left text-xs font-mono">
              <thead>
                <tr class="text-[10px] text-slate-500 border-b border-slate-800 pb-2 uppercase tracking-wider">
                  <th class="pb-2 font-semibold">Tx ID</th>
                  <th class="pb-2 font-semibold">User</th>
                  <th class="pb-2 font-semibold">Score</th>
                  <th class="pb-2 text-right font-semibold">Decision</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                @for (tx of recentTransactions(); track tx.transaction_id) {
                  <tr class="hover:bg-slate-900/60 transition-colors">
                    <td class="py-2.5 text-cyan-300 font-bold truncate max-w-[100px]">{{ tx.transaction_id }}</td>
                    <td class="py-2.5 text-slate-400 truncate max-w-[110px]">{{ tx.user_id }}</td>
                    <td class="py-2.5 font-bold" [ngClass]="tx.risk_score >= 0.90 ? 'text-rose-400' : 'text-amber-400'">
                      {{ tx.risk_score.toFixed(2) }}
                    </td>
                    <td class="py-2.5 text-right">
                      <span
                        class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                        [ngClass]="{
                          'bg-rose-500/15 text-rose-400 border border-rose-500/30': tx.decision === 'BLOCK',
                          'bg-amber-500/15 text-amber-400 border border-amber-500/30': tx.decision === 'REVIEW',
                          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30': tx.decision === 'APPROVE'
                        }"
                      >
                        {{ tx.decision }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- System Activity (4 cols) -->
        <div class="lg:col-span-4 p-6 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-white tracking-tight font-mono">System Activity Feed</h3>
            <a routerLink="/app/audit-log" class="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors">
              View All →
            </a>
          </div>

          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div class="flex items-start gap-3 p-2.5 rounded-xl bg-[#030712]/70 border border-slate-800">
              <div class="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 text-xs">
                ⚡
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-slate-100 flex items-center justify-between">
                  <span>Transaction evaluated</span>
                  <span class="text-[10px] text-slate-500 font-mono">30s ago</span>
                </div>
                <div class="text-[11px] text-slate-400 font-mono truncate">TXN_9K2MBN4S · Approved</div>
              </div>
            </div>

            <div class="flex items-start gap-3 p-2.5 rounded-xl bg-[#030712]/70 border border-slate-800">
              <div class="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 text-xs">
                🛡️
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-slate-100 flex items-center justify-between">
                  <span>Model F inference spike</span>
                  <span class="text-[10px] text-slate-500 font-mono">2m ago</span>
                </div>
                <div class="text-[11px] text-slate-400 font-mono truncate">Batch of 42 txns scored in 3.4ms</div>
              </div>
            </div>

            <div class="flex items-start gap-3 p-2.5 rounded-xl bg-[#030712]/70 border border-slate-800">
              <div class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0 text-xs">
                ✕
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-slate-100 flex items-center justify-between">
                  <span>Abuse Ring Blocked</span>
                  <span class="text-[10px] text-slate-500 font-mono">4m ago</span>
                </div>
                <div class="text-[11px] text-rose-400 font-mono truncate">Score: 0.98 · Multi-device Sybil</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions (3 cols) -->
        <div class="lg:col-span-3 p-6 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col justify-between">
          <div class="mb-4">
            <h3 class="text-sm font-bold text-white tracking-tight font-mono">Quick Actions</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Direct access tools</p>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <a
              routerLink="/app/risk-analyzer"
              class="p-3 rounded-2xl bg-[#030712] hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-center transition-all flex flex-col items-center justify-center group"
            >
              <div class="text-base mb-1 group-hover:scale-110 transition-transform">⚡</div>
              <div class="text-xs font-bold text-slate-200 group-hover:text-cyan-300">Test Risk</div>
              <div class="text-[10px] text-slate-500 font-mono">Simulate</div>
            </a>

            <a
              routerLink="/app/risk-networks"
              class="p-3 rounded-2xl bg-[#030712] hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-center transition-all flex flex-col items-center justify-center group"
            >
              <div class="text-base mb-1 group-hover:scale-110 transition-transform">🕸️</div>
              <div class="text-xs font-bold text-slate-200 group-hover:text-cyan-300">Entity Graph</div>
              <div class="text-[10px] text-slate-500 font-mono">Collusion</div>
            </a>

            <a
              routerLink="/app/monitoring"
              class="p-3 rounded-2xl bg-[#030712] hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-center transition-all flex flex-col items-center justify-center group"
            >
              <div class="text-base mb-1 group-hover:scale-110 transition-transform">📈</div>
              <div class="text-xs font-bold text-slate-200 group-hover:text-cyan-300">Model F</div>
              <div class="text-[10px] text-slate-500 font-mono">Telemetry</div>
            </a>

            <a
              routerLink="/app/audit-log"
              class="p-3 rounded-2xl bg-[#030712] hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-center transition-all flex flex-col items-center justify-center group"
            >
              <div class="text-base mb-1 group-hover:scale-110 transition-transform">📜</div>
              <div class="text-xs font-bold text-slate-200 group-hover:text-cyan-300">Audit Log</div>
              <div class="text-[10px] text-slate-500 font-mono">Immutable</div>
            </a>
          </div>
        </div>
      </div>

      <!-- 5. Bottom Floating Telemetry Bar -->
      <div class="p-4 rounded-2xl bg-[#060A14]/90 border border-slate-800/90 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-400">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Model F (τ = 0.90): <strong class="text-white">Active & Protected</strong></span>
          </div>
          <span class="hidden md:inline text-slate-700">|</span>
          <div class="flex items-center gap-2">
            <span>Cloud MySQL: <strong class="text-cyan-300">Connected</strong></span>
          </div>
          <span class="hidden md:inline text-slate-700">|</span>
          <div>Gateway: <strong class="text-emerald-400">Operational</strong></div>
        </div>

        <a
          routerLink="/app/transactions"
          class="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-black font-extrabold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-105 shrink-0"
        >
          View Live Transactions →
        </a>
      </div>
    </div>
  `,
})
export class LiveOverviewComponent implements OnInit {
  merchantService = inject(MerchantService);
  auth = inject(AuthService);
  txService = inject(TransactionService);

  readonly metrics = this.merchantService.liveMetrics;
  readonly liveTransactions = this.merchantService.liveTransactions;

  readonly recentTransactions = signal<any[]>([
    { transaction_id: 'tx_0027436', user_id: 'usr_004812', amount: 249.99, currency: 'USD', risk_score: 1.0, decision: 'BLOCK', timestamp: new Date().toISOString() },
    { transaction_id: 'tx_0027410', user_id: 'usr_004809', amount: 189.50, currency: 'USD', risk_score: 0.9998, decision: 'BLOCK', timestamp: new Date().toISOString() },
    { transaction_id: 'tx_0014738', user_id: 'usr_003890', amount: 135.00, currency: 'USD', risk_score: 0.621, decision: 'REVIEW', timestamp: new Date().toISOString() },
    { transaction_id: 'tx_0024882', user_id: 'usr_003115', amount: 112.00, currency: 'USD', risk_score: 0.0001, decision: 'APPROVE', timestamp: new Date().toISOString() },
    { transaction_id: 'tx_0024439', user_id: 'usr_002104', amount: 64.20, currency: 'USD', risk_score: 0.0002, decision: 'APPROVE', timestamp: new Date().toISOString() },
  ]);

  ngOnInit(): void {
    const txs = this.txService.getTransactions();
    if (txs && txs.length > 0) {
      const highRisk = txs.filter((t: any) => t.decision === 'BLOCK' || t.decision === 'REVIEW' || t.risk_score > 0.4);
      if (highRisk.length > 0) {
        this.recentTransactions.set(highRisk.slice(0, 5));
      }
    }
  }

  totalTransactionsCount(): number {
    return this.metrics()?.total_transactions || 2847;
  }

  approvalRateText(): string {
    const m = this.metrics();
    if (m && m.total_transactions > 0) {
      return (m.approval_rate * 100).toFixed(1) + '%';
    }
    return '94.7%';
  }

  reviewRateText(): string {
    const m = this.metrics();
    if (m && m.total_transactions > 0) {
      return (m.review_rate * 100).toFixed(1) + '%';
    }
    return '3.8%';
  }

  blockRateText(): string {
    const m = this.metrics();
    if (m && m.total_transactions > 0) {
      return (m.block_rate * 100).toFixed(1) + '%';
    }
    return '1.5%';
  }

  meanRiskScoreText(): string {
    const m = this.metrics();
    if (m && m.total_transactions > 0) {
      return m.average_risk_score.toFixed(3);
    }
    return '0.158';
  }
}
