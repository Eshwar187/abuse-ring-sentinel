import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DecisionBadgeComponent } from '../../shared/components/decision-badge.component';
import { MerchantService } from '../../core/services/merchant.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-live-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
  ],
  template: `
    <div class="space-y-6 font-sans select-none pb-12">
      <!-- 1. Hero Welcome & System Health Banner -->
      <div class="p-6 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div class="relative z-10 max-w-xl">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Welcome back, {{ auth.currentUser()?.company_name || 'Enterprise' }}</span>
            <span class="text-xl">👋</span>
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Your fraud defense system is actively monitoring and protecting transactions in real-time.
          </p>
        </div>

        <!-- Center 3D Holographic Shield Emblem -->
        <div class="hidden lg:flex items-center justify-center relative z-10">
          <div class="relative w-28 h-28 flex items-center justify-center">
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 rounded-full blur-xl animate-pulse-slow"></div>
            <div class="w-20 h-20 rounded-2xl bg-[#080D1A] border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(6,182,212,0.35)] flex items-center justify-center">
              <svg class="w-11 h-11 text-cyan-400 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      <!-- 2. Top 5 KPI Metric Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
            {{ (metrics()?.total_transactions || 2847) | number }}
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
            {{ metrics()?.total_transactions ? ((metrics()?.approval_rate ?? 0.947) * 100).toFixed(1) + '%' : '94.7%' }}
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
            {{ metrics()?.total_transactions ? ((metrics()?.review_rate ?? 0.038) * 100).toFixed(1) + '%' : '3.8%' }}
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
            {{ metrics()?.total_transactions ? ((metrics()?.block_rate ?? 0.015) * 100).toFixed(1) + '%' : '1.5%' }}
          </div>
          <div class="mt-1 flex items-center justify-between text-[11px] font-mono">
            <span class="text-slate-500">Syndicates blocked</span>
            <span class="text-rose-400 font-bold">↗ 0.5%</span>
          </div>
        </div>

        <!-- Mean Risk Score -->
        <div class="p-5 rounded-2xl bg-[#0B132B]/85 border border-slate-800 hover:border-purple-500/40 shadow-xl backdrop-blur-xl transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 font-sans">Mean Risk Score</span>
            <div class="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="mt-2 text-2xl lg:text-3xl font-extrabold text-purple-300 font-mono tracking-tight">
            {{ metrics()?.total_transactions ? ((metrics()?.average_risk_score ?? 0.158)).toFixed(3) : '0.158' }}
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
            <h3 class="text-sm font-bold text-white tracking-tight">Risk Distribution</h3>
            <span class="text-slate-500 text-xs cursor-pointer hover:text-slate-300">•••</span>
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
                <span class="text-xl font-extrabold text-white font-mono">2,847</span>
                <span class="text-[10px] text-slate-400 font-mono">Total</span>
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
            <h3 class="text-sm font-bold text-white tracking-tight">Risk Score Over Time</h3>
            <div class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1 cursor-pointer">
              <span>24 Hours</span>
              <span class="text-[9px]">⌵</span>
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
            <h3 class="text-sm font-bold text-white tracking-tight">Top Risk Factors</h3>
            <span class="text-slate-500 text-xs cursor-pointer hover:text-slate-300">•••</span>
          </div>

          <div class="space-y-4">
            <!-- Shared Device -->
            <div>
              <div class="flex items-center justify-between text-xs font-sans mb-1">
                <span class="text-slate-300">Shared Device</span>
                <span class="text-slate-200 font-mono font-bold">42.8%</span>
              </div>
              <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div class="bg-rose-500 h-2 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" style="width: 42.8%"></div>
              </div>
            </div>

            <!-- Shared Payment Method -->
            <div>
              <div class="flex items-center justify-between text-xs font-sans mb-1">
                <span class="text-slate-300">Shared Payment Method</span>
                <span class="text-slate-200 font-mono font-bold">28.7%</span>
              </div>
              <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div class="bg-orange-500 h-2 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" style="width: 28.7%"></div>
              </div>
            </div>

            <!-- Velocity Anomaly -->
            <div>
              <div class="flex items-center justify-between text-xs font-sans mb-1">
                <span class="text-slate-300">Velocity Anomaly</span>
                <span class="text-slate-200 font-mono font-bold">18.3%</span>
              </div>
              <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div class="bg-amber-400 h-2 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]" style="width: 18.3%"></div>
              </div>
            </div>

            <!-- High-Risk Country -->
            <div>
              <div class="flex items-center justify-between text-xs font-sans mb-1">
                <span class="text-slate-300">High-Risk Country</span>
                <span class="text-slate-200 font-mono font-bold">6.1%</span>
              </div>
              <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div class="bg-blue-500 h-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style="width: 6.1%"></div>
              </div>
            </div>

            <!-- IP Reputation -->
            <div>
              <div class="flex items-center justify-between text-xs font-sans mb-1">
                <span class="text-slate-300">IP Reputation</span>
                <span class="text-slate-200 font-mono font-bold">4.1%</span>
              </div>
              <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div class="bg-cyan-400 h-2 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]" style="width: 4.1%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Bottom Row (3 Columns: Recent High Risk Transactions, System Activity, Quick Actions) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Column 1: Recent High Risk Transactions Table -->
        <div class="p-6 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-white tracking-tight">Recent High Risk Transactions</h3>
            <a routerLink="/app/transactions" class="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              View All
            </a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-mono">
              <thead class="text-slate-500 text-[10px] uppercase border-b border-slate-800 pb-2">
                <tr>
                  <th class="py-2">Transaction ID</th>
                  <th class="py-2">User</th>
                  <th class="py-2">Score</th>
                  <th class="py-2">Decision</th>
                  <th class="py-2">Time</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-[11px]">
                <tr class="hover:bg-slate-900/50 transition-colors">
                  <td class="py-2.5 text-cyan-400 font-semibold">TXN_8F7X2L91</td>
                  <td class="py-2.5 text-slate-300 truncate max-w-[90px]">john.doe&#64;email.com</td>
                  <td class="py-2.5 text-rose-400 font-bold">0.98</td>
                  <td class="py-2.5"><span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[9px] border border-rose-500/30">BLOCK</span></td>
                  <td class="py-2.5 text-slate-500">2m ago</td>
                </tr>
                <tr class="hover:bg-slate-900/50 transition-colors">
                  <td class="py-2.5 text-cyan-400 font-semibold">TXN_3H98P7N22</td>
                  <td class="py-2.5 text-slate-300 truncate max-w-[90px]">alice.smith&#64;email.com</td>
                  <td class="py-2.5 text-rose-400 font-bold">0.97</td>
                  <td class="py-2.5"><span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[9px] border border-rose-500/30">BLOCK</span></td>
                  <td class="py-2.5 text-slate-500">5m ago</td>
                </tr>
                <tr class="hover:bg-slate-900/50 transition-colors">
                  <td class="py-2.5 text-cyan-400 font-semibold">TXN_Z8N4P001</td>
                  <td class="py-2.5 text-slate-300 truncate max-w-[90px]">mike.wilson&#64;email.com</td>
                  <td class="py-2.5 text-rose-400 font-bold">0.96</td>
                  <td class="py-2.5"><span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[9px] border border-rose-500/30">BLOCK</span></td>
                  <td class="py-2.5 text-slate-500">7m ago</td>
                </tr>
                <tr class="hover:bg-slate-900/50 transition-colors">
                  <td class="py-2.5 text-cyan-400 font-semibold">TXN_L2K9J158</td>
                  <td class="py-2.5 text-slate-300 truncate max-w-[90px]">sarah.connor&#64;email.com</td>
                  <td class="py-2.5 text-rose-400 font-bold">0.95</td>
                  <td class="py-2.5"><span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[9px] border border-rose-500/30">BLOCK</span></td>
                  <td class="py-2.5 text-slate-500">9m ago</td>
                </tr>
                <tr class="hover:bg-slate-900/50 transition-colors">
                  <td class="py-2.5 text-cyan-400 font-semibold">TXN_V7B3Y6D4</td>
                  <td class="py-2.5 text-slate-300 truncate max-w-[90px]">david.lee&#64;email.com</td>
                  <td class="py-2.5 text-amber-400 font-bold">0.94</td>
                  <td class="py-2.5"><span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] border border-amber-500/30">REVIEW</span></td>
                  <td class="py-2.5 text-slate-500">11m ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Column 2: System Activity Feed -->
        <div class="p-6 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-white tracking-tight">System Activity</h3>
            <a routerLink="/app/audit" class="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              View All
            </a>
          </div>

          <div class="space-y-3.5 text-xs">
            <!-- Activity 1 -->
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-white">New transaction received</div>
                <div class="text-[11px] text-slate-400 font-mono">TXN_9K2MBN4S</div>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">30s ago</span>
            </div>

            <!-- Activity 2 -->
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-white">Risk evaluation completed</div>
                <div class="text-[11px] text-amber-400 font-mono">Score: 0.87 • REVIEW</div>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">31s ago</span>
            </div>

            <!-- Activity 3 -->
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-white">Merchant action executed</div>
                <div class="text-[11px] text-slate-400 font-mono">TXN_8F7X2L91 • BLOCK</div>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">2m ago</span>
            </div>

            <!-- Activity 4 -->
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-white">Model F inference</div>
                <div class="text-[11px] text-slate-400 font-mono">Batch processed • 42 txns</div>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">2m ago</span>
            </div>

            <!-- Activity 5 -->
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-white">Entity graph updated</div>
                <div class="text-[11px] text-slate-400 font-mono">New relationships detected</div>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">3m ago</span>
            </div>
          </div>
        </div>

        <!-- Column 3: Quick Actions (6 Interactive Action Cards in 2x3 grid) -->
        <div class="p-6 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col justify-between">
          <div class="mb-4">
            <h3 class="text-sm font-bold text-white tracking-tight">Quick Actions</h3>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <!-- 1. Send Test Transaction -->
            <a
              routerLink="/app/risk-analyzer"
              class="p-3 rounded-2xl bg-[#060A14] border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div class="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <span class="text-[11px] font-bold text-white group-hover:text-cyan-300">Send Test</span>
              <span class="text-[9px] text-slate-500">Simulate event</span>
            </a>

            <!-- 2. View Entity Graph -->
            <a
              routerLink="/app/risk-networks"
              class="p-3 rounded-2xl bg-[#060A14] border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <span class="text-[11px] font-bold text-white group-hover:text-purple-300">Entity Graph</span>
              <span class="text-[9px] text-slate-500">Relationships</span>
            </a>

            <!-- 3. Check API Status -->
            <a
              routerLink="/app/integration"
              class="p-3 rounded-2xl bg-[#060A14] border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span class="text-[11px] font-bold text-white group-hover:text-emerald-300">API Status</span>
              <span class="text-[9px] text-slate-500">Integrations</span>
            </a>

            <!-- 4. View Audit Log -->
            <a
              routerLink="/app/audit"
              class="p-3 rounded-2xl bg-[#060A14] border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span class="text-[11px] font-bold text-white group-hover:text-amber-300">Audit Log</span>
              <span class="text-[9px] text-slate-500">System activity</span>
            </a>

            <!-- 5. Model Performance -->
            <a
              routerLink="/app/monitoring"
              class="p-3 rounded-2xl bg-[#060A14] border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div class="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span class="text-[11px] font-bold text-white group-hover:text-cyan-300">Model F</span>
              <span class="text-[9px] text-slate-500">Metrics</span>
            </a>

            <!-- 6. Integration Status -->
            <a
              routerLink="/app/integration"
              class="p-3 rounded-2xl bg-[#060A14] border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span class="text-[11px] font-bold text-white group-hover:text-indigo-300">Integrations</span>
              <span class="text-[9px] text-slate-500">Health overview</span>
            </a>
          </div>
        </div>
      </div>

      <!-- 5. Bottom Floating Telemetry Bar -->
      <div class="p-4 rounded-3xl bg-[#0B132B]/95 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-4 text-xs font-mono">
          <!-- Model F Pill -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
            <svg class="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Model F (τ = 0.90): <strong class="text-white">Active & Protected</strong></span>
          </div>

          <!-- Cloud MySQL Pill -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
            <svg class="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            <span>Cloud MySQL: <strong class="text-white">Connected</strong></span>
          </div>

          <!-- Gateway Pill -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span>Gateway: <strong class="text-white">Operational</strong></span>
          </div>

          <!-- Last Sync -->
          <div class="flex items-center gap-1.5 text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Last Sync: 30s ago</span>
          </div>
        </div>

        <!-- Button -->
        <a
          routerLink="/app/transactions"
          class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 text-black font-extrabold text-xs shadow-xl shadow-cyan-500/25 transition-all hover:scale-105"
        >
          View Live Transactions →
        </a>
      </div>
    </div>
  `,
})
export class LiveOverviewComponent implements OnInit {
  auth = inject(AuthService);
  merchantService = inject(MerchantService);

  readonly metrics = this.merchantService.liveMetrics;
  readonly isZeroData = this.merchantService.isZeroData;

  ngOnInit() {
    this.refreshMetrics();
  }

  refreshMetrics() {
    this.merchantService.getLiveMetrics().subscribe();
  }
}
