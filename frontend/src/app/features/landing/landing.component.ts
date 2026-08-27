import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      <!-- Ambient Studio Lighting Mesh -->
      <div class="fixed inset-0 pointer-events-none z-0">
        <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-cyan-500/12 via-blue-600/8 to-transparent blur-[160px] rounded-full"></div>
        <div class="absolute top-1/3 right-0 w-[600px] h-[600px] bg-purple-600/8 blur-[180px] rounded-full"></div>
        <div class="absolute bottom-1/4 left-0 w-[600px] h-[500px] bg-emerald-500/6 blur-[180px] rounded-full"></div>
        <!-- Subtle High-Tech Blueprint Grid -->
        <div class="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <!-- Navigation Bar -->
      <header class="border-b border-slate-800/80 bg-[#060A14]/90 backdrop-blur-2xl sticky top-0 z-40 py-3.5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <!-- Brand Logo -->
          <a routerLink="/" class="flex items-center gap-3.5 group cursor-pointer">
            <div class="relative flex items-center shrink-0">
              <img src="vigilai_logo.jpg" alt="VigilAI Logo" class="w-9 h-9 rounded-xl shadow-md shadow-cyan-500/20 object-cover border border-cyan-500/40 group-hover:scale-105 transition-all" />
              <span class="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 border-2 border-[#060A14]"></span>
              </span>
            </div>
            <div class="flex flex-col justify-center">
              <div class="flex items-center gap-2 leading-none">
                <span class="text-base font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors">VigilAI</span>
                <span class="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                  ENTERPRISE
                </span>
              </div>
              <p class="text-[10px] text-slate-400 font-mono mt-0.5">Autonomous Fraud & Ring Defense</p>
            </div>
          </a>

          <!-- Nav Items -->
          <nav class="hidden lg:flex items-center gap-8 text-xs font-medium text-slate-400">
            <a href="#how-it-works" class="hover:text-cyan-300 transition-colors">Collusion Anatomy</a>
            <a href="#live-simulator" class="hover:text-cyan-300 transition-colors">Live Simulation</a>
            <a href="#api" class="hover:text-cyan-300 transition-colors">Developer SDK</a>
            <a href="#about-developer" class="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>About Developer</span>
            </a>
          </nav>

          <!-- Right Action Bar -->
          <div class="flex items-center gap-3">
            <a
              routerLink="/demo"
              class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-300 transition-all shadow-sm cursor-pointer"
            >
              <span>▶ 6.9k Benchmark</span>
            </a>
            <a
              routerLink="/login"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </a>
            <a
              routerLink="/signup"
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-black text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 cursor-pointer"
            >
              Start Free Integration
            </a>
          </div>
        </div>
      </header>

      <!-- HERO SECTION -->
      <section class="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div class="text-center max-w-4xl mx-auto">
          <!-- Top Badge -->
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-6 shadow-[0_0_20px_rgba(6,182,212,0.15)] font-mono">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Real-Time Heterogeneous Entity Graph & Gradient Boosting</span>
          </div>

          <!-- Main Title -->
          <h1 class="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Stop Coordinated Fraud Rings <br class="hidden sm:inline" />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">
              Before They Drain Your Revenue.
            </span>
          </h1>

          <!-- Subtitle -->
          <p class="mt-6 text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            VigilAI neutralizes distributed Sybil attacks, promo voucher harvesting, and card testing using 
            <strong>33 zero-leakage point-in-time features</strong> fused with real-time bipartite collusion graphs in sub-5ms latency.
          </p>

          <!-- Dual CTAs -->
          <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              routerLink="/signup"
              class="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-extrabold shadow-xl shadow-cyan-500/30 transition-all hover:scale-105 cursor-pointer"
            >
              <span>Get API Credentials Free →</span>
            </a>
            <a
              routerLink="/demo"
              class="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#0B132B] hover:bg-[#111C38] border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold transition-all hover:scale-105 shadow-lg cursor-pointer"
            >
              <span>▶ Launch 6.9K Benchmark Dataset</span>
            </a>
          </div>

          <!-- Trust Badges -->
          <div class="mt-10 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-400 font-mono">
            <span class="flex items-center gap-1.5"><span class="text-cyan-400 font-bold">⚡</span> &lt; 5ms Decision Latency</span>
            <span class="flex items-center gap-1.5"><span class="text-emerald-400 font-bold">🛡️</span> Model F (Cost-Optimal &tau;* = 0.90)</span>
            <span class="flex items-center gap-1.5"><span class="text-purple-400 font-bold">🕸️</span> Bipartite Graph Ring Clustering</span>
            <span class="flex items-center gap-1.5"><span class="text-blue-400 font-bold">🔒</span> Zero Point-in-Time Data Leakage</span>
          </div>
        </div>

        <!-- HERO INTERACTIVE RADAR & LIVE EVENT FEED -->
        <div class="mt-14 max-w-5xl mx-auto rounded-3xl bg-[#060A14]/90 border border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-2xl relative overflow-hidden" id="live-simulator">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 class="text-sm font-bold text-white font-mono uppercase tracking-wider">Live Transaction Evaluation Pipeline</h3>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">Streaming real-time telemetry from Model F inference engine</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono text-emerald-400 font-bold">
                ● 100% INFERENCE UPTIME
              </span>
              <span class="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-mono text-cyan-300 font-bold">
                TLS 1.3
              </span>
            </div>
          </div>

          <!-- 3 Step Interactive Visualization -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-xs">
            <!-- Step 1: Raw Ingestion -->
            <div class="p-5 rounded-2xl bg-[#0B132B]/60 border border-slate-800 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono font-bold text-cyan-400 uppercase">1. Raw Event Ingestion</span>
                <span class="text-[10px] font-mono text-slate-400">0.8ms</span>
              </div>
              <div class="p-3 rounded-xl bg-[#030712] font-mono text-[11px] text-slate-300 space-y-1 border border-slate-800/80">
                <div class="text-slate-400"><span class="text-cyan-300">POST</span> /api/v1/risk/evaluate</div>
                <div>User: <span class="text-cyan-400 font-bold">usr_sybil_991</span></div>
                <div>Amount: <span class="text-emerald-400 font-bold">₹499.00</span> (PROMO50)</div>
                <div>Device: <span class="text-purple-400">dev_fp_x99a</span></div>
              </div>
              <p class="text-[11px] text-slate-400 leading-normal">
                HMAC validated, payload normalized, and tenant security scope verified.
              </p>
            </div>

            <!-- Step 2: 33 Point-in-Time Features & Graph -->
            <div class="p-5 rounded-2xl bg-[#0B132B]/60 border border-purple-500/30 space-y-3 relative shadow-[0_0_20px_rgba(168,85,247,0.1)]">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono font-bold text-purple-300 uppercase">2. Entity Graph & Velocity</span>
                <span class="text-[10px] font-mono text-slate-400">2.1ms</span>
              </div>
              <div class="p-3 rounded-xl bg-[#030712] font-mono text-[11px] text-slate-300 space-y-1 border border-purple-500/20">
                <div>Device Degree: <span class="text-rose-400 font-bold">14 shared users</span></div>
                <div>IP Velocity: <span class="text-rose-400 font-bold">28 req / 10min</span></div>
                <div>Collusion Index: <span class="text-rose-400 font-bold">0.962</span></div>
                <div>Leakage Check: <span class="text-emerald-400">t &lt; t_pred (Valid)</span></div>
              </div>
              <p class="text-[11px] text-slate-400 leading-normal">
                Bipartite network detects shared IP and device linkage across 14 pseudo-identities.
              </p>
            </div>

            <!-- Step 3: Decision Tree Model F -->
            <div class="p-5 rounded-2xl bg-[#0B132B]/60 border border-rose-500/30 space-y-3 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono font-bold text-rose-400 uppercase">3. Cost-Optimal Decision</span>
                <span class="text-[10px] font-mono text-slate-400">1.4ms</span>
              </div>
              <div class="p-3 rounded-xl bg-rose-950/30 font-mono text-[11px] text-slate-300 space-y-1 border border-rose-500/30">
                <div class="flex items-center justify-between">
                  <span>Verdict:</span>
                  <span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-black">BLOCK</span>
                </div>
                <div>Risk Score: <span class="text-rose-400 font-bold">0.984</span> (Threshold: 0.90)</div>
                <div>Action: <span class="text-rose-300">AUTO_REJECT_VOUCHER</span></div>
                <div>Webhook: <span class="text-emerald-400">Dispatched (200 OK)</span></div>
              </div>
              <p class="text-[11px] text-slate-400 leading-normal">
                Coordinated Sybil voucher attack terminated before order authorization.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- WHY TRADITIONAL FRAUD ENGINES FAIL -->
      <section class="py-20 bg-[#060A14]/90 border-y border-slate-800/80 px-4 sm:px-6 lg:px-8 relative z-10" id="how-it-works">
        <div class="max-w-7xl mx-auto">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono mb-3">
              <span>PROBLEM VS SOLUTION</span>
            </div>
            <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Why Single-Account Fraud Filters Fail</h2>
            <p class="text-sm text-slate-400 mt-2">
              Modern fraud syndicates use micro-transactions across hundreds of disposable accounts to bypass traditional velocity rules.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Legacy Filter Flaws -->
            <div class="bg-[#0B132B]/60 border border-rose-500/20 rounded-3xl p-8 backdrop-blur-xl shadow-xl space-y-6">
              <div class="flex items-center gap-3 text-rose-400 font-bold text-sm uppercase tracking-wider font-mono">
                <span class="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold">✕</span>
                <span>Traditional Per-Account Rules</span>
              </div>
              <ul class="space-y-4 text-xs text-slate-300">
                <li class="flex items-start gap-3">
                  <span class="text-rose-400 font-bold shrink-0 mt-0.5">✕</span>
                  <span><strong>Siloed Analysis:</strong> Evaluates accounts in total isolation, blinded to shared devices, cards, and residential proxies.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-rose-400 font-bold shrink-0 mt-0.5">✕</span>
                  <span><strong>Voucher Drainage:</strong> Colluding attackers register distinct names and emails to harvest new-user sign-up promotions.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-rose-400 font-bold shrink-0 mt-0.5">✕</span>
                  <span><strong>High False Rejections:</strong> Over-aggressive heuristics block legitimate high-value customers during checkout.</span>
                </li>
              </ul>
              <div class="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300 text-xs font-mono">
                Average Enterprise Cost: ₹2.8M monthly in unmitigated promo abuse & lost revenue
              </div>
            </div>

            <!-- VigilAI Bipartite Graph Solution -->
            <div class="bg-gradient-to-br from-[#0B132B] to-[#080D1A] border border-cyan-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-xl space-y-6">
              <div class="flex items-center gap-3 text-cyan-300 font-bold text-sm uppercase tracking-wider font-mono">
                <span class="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold">✓</span>
                <span>VigilAI Heterogeneous Graph Core</span>
              </div>
              <ul class="space-y-4 text-xs text-slate-300">
                <li class="flex items-start gap-3">
                  <span class="text-cyan-400 font-bold shrink-0 mt-0.5">✓</span>
                  <span><strong>Real-Time Bipartite Clustering:</strong> Maps entities across Device IDs, IPs, Payment Tokens, and Addresses in milliseconds.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-cyan-400 font-bold shrink-0 mt-0.5">✓</span>
                  <span><strong>Zero-Leakage Model F:</strong> 33 engineered features derived strictly at t &lt; t_pred to guarantee mathematical causality.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-cyan-400 font-bold shrink-0 mt-0.5">✓</span>
                  <span><strong>Automated Mitigation:</strong> Real-time webhooks execute instant order blocks, card bans, or 2FA step-ups automatically.</span>
                </li>
              </ul>
              <div class="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                Proven Impact: 99.4% ring detection rate with &lt; 0.1% false-positive rate
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- DEVELOPER SDK CODE SECTION -->
      <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10" id="api">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono mb-3">
            <span>⚡ DROP-IN INTEGRATION</span>
          </div>
          <h2 class="text-3xl font-extrabold text-white tracking-tight">API-First Developer Architecture</h2>
          <p class="text-xs text-slate-400 mt-2">Send a single JSON payload from your checkout backend to receive instantaneous risk decisions.</p>
        </div>

        <!-- Code Terminal Box -->
        <div class="rounded-3xl bg-[#060A14] border border-slate-800 shadow-2xl overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#080D1A]/90 flex-wrap gap-3">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span class="ml-3 text-xs font-mono text-slate-400">POST /api/v1/risk/evaluate</span>
            </div>
            <div class="flex items-center gap-2 text-xs font-mono">
              <button
                type="button"
                (click)="activeSdkTab.set('node')"
                [class.bg-cyan-500]="activeSdkTab() === 'node'"
                [class.text-black]="activeSdkTab() === 'node'"
                [class.text-slate-400]="activeSdkTab() !== 'node'"
                class="px-3 py-1 rounded-lg transition-colors font-bold cursor-pointer"
              >
                Node.js / TS
              </button>
              <button
                type="button"
                (click)="activeSdkTab.set('python')"
                [class.bg-cyan-500]="activeSdkTab() === 'python'"
                [class.text-black]="activeSdkTab() === 'python'"
                [class.text-slate-400]="activeSdkTab() !== 'python'"
                class="px-3 py-1 rounded-lg transition-colors font-bold cursor-pointer"
              >
                Python
              </button>
              <button
                type="button"
                (click)="activeSdkTab.set('curl')"
                [class.bg-cyan-500]="activeSdkTab() === 'curl'"
                [class.text-black]="activeSdkTab() === 'curl'"
                [class.text-slate-400]="activeSdkTab() !== 'curl'"
                class="px-3 py-1 rounded-lg transition-colors font-bold cursor-pointer"
              >
                cURL
              </button>
            </div>
          </div>

          <!-- Code Snippets -->
          <div class="p-6 text-xs font-mono overflow-x-auto bg-[#030712]">
            <pre *ngIf="activeSdkTab() === 'node'" class="text-cyan-300 leading-relaxed"><code>import axios from 'axios';

// Evaluate inbound checkout transaction in sub-5ms
const response = await axios.post('https://vigil-ai-f0ev.onrender.com/api/v1/risk/evaluate', &#123;
  transaction_id: 'tx_checkout_99182',
  user_id: 'cust_98124',
  amount: 499.00,
  currency: 'INR',
  timestamp: new Date().toISOString(),
  device_id: 'dev_fingerprint_881',
  ip_address: '198.51.100.22',
  payment_method_id: 'pm_card_tok_99',
  email_domain: 'buyer&#64;gmail.com',
  promo_code: 'WELCOME50'
&#125;, &#123;
  headers: &#123; 'X-API-Key': 'ars_live_••••••••••••••••' &#125;
&#125;);

console.log(response.data.decision);   // 'APPROVE' | 'REVIEW' | 'BLOCK'
console.log(response.data.risk_score); // 0.0124 (1.24% fraud probability)
console.log(response.data.reasons);    // ['LOW_RISK_ESTABLISHED_ACCOUNT']</code></pre>

            <pre *ngIf="activeSdkTab() === 'python'" class="text-emerald-300 leading-relaxed"><code>import requests
from datetime import datetime, timezone

payload = &#123;
    "transaction_id": "tx_checkout_99182",
    "user_id": "cust_98124",
    "amount": 499.00,
    "currency": "INR",
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "device_id": "dev_fingerprint_881",
    "ip_address": "198.51.100.22",
    "payment_method_id": "pm_card_tok_99",
    "email_domain": "buyer&#64;gmail.com",
    "promo_code": "WELCOME50"
&#125;

headers = &#123;"X-API-Key": "ars_live_••••••••••••••••"&#125;
resp = requests.post("https://vigil-ai-f0ev.onrender.com/api/v1/risk/evaluate", json=payload, headers=headers)
result = resp.json()

print("Decision:", result["decision"])     # BLOCK
print("Risk Score:", result["risk_score"]) # 0.9842</code></pre>

            <pre *ngIf="activeSdkTab() === 'curl'" class="text-purple-300 leading-relaxed"><code>curl -X POST "https://vigil-ai-f0ev.onrender.com/api/v1/risk/evaluate" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ars_live_••••••••••••••••" \
  -d '&#123;
    "transaction_id": "tx_checkout_99182",
    "user_id": "cust_98124",
    "amount": 499.00,
    "currency": "INR",
    "timestamp": "2026-08-27T20:30:00Z",
    "device_id": "dev_fingerprint_881",
    "ip_address": "198.51.100.22",
    "payment_method_id": "pm_card_tok_99",
    "promo_code": "WELCOME50"
  &#125;'</code></pre>
          </div>
        </div>
      </section>

      <!-- MEET THE ARCHITECT & DEVELOPER SECTION (AUTHENTIC RESUME & REAL PHOTO) -->
      <section class="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10" id="about-developer">
        <div class="text-center max-w-3xl mx-auto mb-14">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>SYSTEMS ARCHITECT & CREATOR</span>
          </div>
          <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Meet the Developer
          </h2>
          <p class="text-sm text-slate-400 mt-2">
            Engineering Zero-Trust AppSec, Autonomous AI Security Infrastructure, and Scalable Microservices.
          </p>
        </div>

        <div class="bg-gradient-to-r from-[#0B132B] via-[#080D1A] to-[#060A14] border border-cyan-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          <div class="absolute -right-20 -top-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start relative z-10">
            <!-- Left Professional Photo & Bio Card -->
            <div class="lg:col-span-4 flex flex-col items-center text-center p-6 rounded-2xl bg-[#030712]/90 border border-slate-800 shadow-2xl">
              <!-- Real User Headshot -->
              <div class="relative mb-5">
                <div class="w-36 h-36 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 p-1 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                  <img
                    src="eshwar_photo.jpg"
                    alt="Eshwar J - Lead AI & Systems Engineer"
                    class="w-full h-full rounded-xl object-cover"
                  />
                </div>
                <span class="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#030712]"></span>
                </span>
              </div>

              <h3 class="text-2xl font-extrabold text-white">Eshwar J</h3>
              <p class="text-xs text-cyan-400 font-mono font-bold mt-1">AppSec & AI Systems Engineer</p>
              
              <div class="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-mono">
                <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  SRM University (CGPA 9.19)
                </span>
                <span class="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  Graduating 2027
                </span>
              </div>

              <!-- Quick Contact & Social Buttons -->
              <div class="mt-6 flex flex-col w-full gap-2 text-xs font-mono">
                <a
                  href="https://github.com/Eshwar187"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>GitHub: &#64;Eshwar187</span>
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <a
                  href="mailto:jeshwar.work@gmail.com"
                  class="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>jeshwar.work&#64;gmail.com</span>
                </a>
              </div>
            </div>

            <!-- Right Verified Resume Experience, Projects & Skills -->
            <div class="lg:col-span-8 space-y-6">
              <!-- Summary Statement -->
              <div>
                <h4 class="text-xl font-extrabold text-white tracking-tight">
                  Autonomous AI Defense & Zero-Trust Application Security
                </h4>
                <p class="text-xs text-slate-300 mt-2 leading-relaxed">
                  I specialize in secure application design, zero-trust cryptographic architectures, and autonomous machine learning systems. I designed <strong>VigilAI</strong> to eliminate single-account fraud detection blind spots by synthesizing <strong>zero-leakage point-in-time velocity features</strong> with <strong>heterogeneous entity collusion graphs</strong> and <strong>gradient-boosted decision trees (Model F)</strong>.
                </p>
              </div>

              <!-- Industry Work Experience & Background -->
              <div class="p-4 rounded-2xl bg-[#030712]/80 border border-slate-800 space-y-3">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <h5 class="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      Work Experience — NeuralBI Ltd (AI & Full-Stack Intern)
                    </h5>
                  </div>
                  <span class="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    Jun 2025 – Aug 2025 (Remote)
                  </span>
                </div>
                <ul class="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Triaged and reproduced defects across structured UAT cycles before production deployment with 100% sprint completion.</li>
                  <li>Built real-time telemetry dashboards tracking request volumes and error rates across microservices handling <strong>10K+ daily requests</strong>.</li>
                  <li>Engineered async Python & Node.js microservices with optimized database queries, reducing pipeline latency by <strong>~35%</strong>.</li>
                  <li>Authored SRS and security API design specifications for 12+ RESTful endpoints under strict AppSec constraints.</li>
                </ul>
              </div>

              <!-- Flagship Engineering Projects Grid (From Resume) -->
              <div>
                <h5 class="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider mb-3">
                  Verified Engineering Portfolio
                </h5>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <!-- AetherVault -->
                  <div class="p-3.5 rounded-2xl bg-[#030712]/70 border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-cyan-300 font-mono">🛡️ AetherVault</span>
                      <span class="text-[9px] font-mono text-slate-400">Zero-Trust Secrets</span>
                    </div>
                    <p class="text-[11px] text-slate-400">
                      Production secrets manager with AES-256 encryption at rest, scoped RBAC (dev/staging/prod), password-protected exports, and Snyk audit scanning.
                    </p>
                  </div>

                  <!-- Kerno SaaS CRM -->
                  <div class="p-3.5 rounded-2xl bg-[#030712]/70 border border-slate-800 hover:border-purple-500/40 transition-colors space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-purple-300 font-mono">⚡ Kerno CRM</span>
                      <span class="text-[9px] font-mono text-slate-400">Kubernetes & AI</span>
                    </div>
                    <p class="text-[11px] text-slate-400">
                      Multi-tenant SaaS CRM on Kubernetes with tenant-scoped RLS across 12 tables, payment anomaly detection, Razorpay webhooks, and JWT hardening.
                    </p>
                  </div>

                  <!-- VigilAI -->
                  <div class="p-3.5 rounded-2xl bg-[#030712]/70 border border-slate-800 hover:border-emerald-500/40 transition-colors space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-emerald-300 font-mono">🧠 VigilAI Sentinel</span>
                      <span class="text-[9px] font-mono text-slate-400">Autonomous Defense</span>
                    </div>
                    <p class="text-[11px] text-slate-400">
                      Heterogeneous entity collusion graphs, 33 zero-leakage point-in-time features, HistGradientBoosting (Model F &tau;*=0.90), sub-5ms latency.
                    </p>
                  </div>

                  <!-- GitInsights -->
                  <div class="p-3.5 rounded-2xl bg-[#030712]/70 border border-slate-800 hover:border-blue-500/40 transition-colors space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-blue-300 font-mono">📊 GitInsights</span>
                      <span class="text-[9px] font-mono text-slate-400">Analytics Platform</span>
                    </div>
                    <p class="text-[11px] text-slate-400">
                      Security-conscious API layer with rate limiting and session controls; ~30% query response time improvement via PostgreSQL optimization.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Certifications & Awards Banner -->
              <div class="p-4 rounded-2xl bg-cyan-950/25 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
                <div class="space-y-1 text-center sm:text-left">
                  <div class="text-cyan-300 font-bold">🏆 Certifications & Accolades</div>
                  <div class="text-[11px] text-slate-300">
                    Finalist NASSCOM NextGen Nexus · Top 5 Smart India Hackathon (SIH) · NVIDIA Certified (Deep Learning & NLP)
                  </div>
                </div>
                <a
                  href="https://github.com/Eshwar187/abuse-ring-sentinel"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all shrink-0 shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  View Open Source Repo →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- BOTTOM CALL TO ACTION BANNER -->
      <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center z-10">
        <div class="bg-gradient-to-b from-[#0B132B] via-[#080D1A] to-[#060A14] border border-cyan-500/30 rounded-3xl p-10 sm:p-14 shadow-2xl relative overflow-hidden">
          <div class="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to deploy autonomous fraud protection?
          </h2>
          <p class="mt-4 text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Get instant production credentials, real-time entity network visualization, and automated webhook defense.
          </p>
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              routerLink="/signup"
              class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold shadow-xl shadow-cyan-500/30 transition-all hover:scale-105 cursor-pointer"
            >
              Get Free API Credentials
            </a>
            <a
              routerLink="/demo"
              class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#030712] hover:bg-slate-900 text-slate-200 text-xs font-semibold border border-slate-700 transition-all hover:scale-105 cursor-pointer"
            >
              Explore 6.9k Benchmark Dataset
            </a>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="mt-auto border-t border-slate-800/80 bg-[#060A14] pt-12 pb-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-400 z-10">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800/80">
          <!-- Col 1 -->
          <div class="lg:col-span-2 space-y-3">
            <div class="flex items-center gap-3">
              <img src="vigilai_logo.jpg" alt="VigilAI Logo" class="w-8 h-8 rounded-xl object-cover border border-cyan-500/40" />
              <span class="text-base font-extrabold text-white">VigilAI <span class="text-xs text-cyan-400 font-mono font-bold">PRO</span></span>
            </div>
            <p class="text-xs text-slate-400 leading-relaxed max-w-sm">
              Autonomous AI Cybersecurity and Heterogeneous Entity Collusion Defense. Stopping distributed Sybil rings, voucher abuse, and card testing with zero point-in-time leakage.
            </p>
            <div class="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Operational (FastAPI + Model F + Self-Healing State)</span>
            </div>
          </div>

          <!-- Col 2 -->
          <div class="space-y-2.5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-white font-mono">Platform</h4>
            <ul class="space-y-1.5 text-xs">
              <li><a href="#how-it-works" class="hover:text-cyan-300 transition-colors">Collusion Anatomy</a></li>
              <li><a routerLink="/demo" class="hover:text-cyan-300 transition-colors">6.9k Benchmark Demo</a></li>
              <li><a href="#api" class="hover:text-cyan-300 transition-colors">Developer SDK</a></li>
              <li><a routerLink="/login" class="hover:text-cyan-300 transition-colors">Merchant Console</a></li>
              <li><a href="#about-developer" class="hover:text-cyan-300 transition-colors">Meet the Developer</a></li>
            </ul>
          </div>

          <!-- Col 3 -->
          <div class="space-y-2.5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-white font-mono">Security & AI</h4>
            <ul class="space-y-1.5 text-xs">
              <li><span class="text-slate-400">Model F (&tau;* = 0.90)</span></li>
              <li><span class="text-slate-400">Heterogeneous Entity Graphs</span></li>
              <li><span class="text-slate-400">TLS 1.3 Transport Security</span></li>
              <li><span class="text-slate-400">Strict Tenant Data Isolation</span></li>
              <li><span class="text-slate-400">Zero-Leakage Causality</span></li>
            </ul>
          </div>

          <!-- Col 4 -->
          <div class="space-y-2.5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-white font-mono">Legal & Compliance</h4>
            <ul class="space-y-1.5 text-xs">
              <li><a routerLink="/terms" class="hover:text-cyan-300 transition-colors font-medium">Terms of Service</a></li>
              <li><a routerLink="/privacy" class="hover:text-cyan-300 transition-colors font-medium">Privacy Policy</a></li>
              <li><a routerLink="/terms" class="hover:text-cyan-300 transition-colors">Acceptable Use Policy</a></li>
              <li><a routerLink="/privacy" class="hover:text-cyan-300 transition-colors">GDPR & DPDP Compliance</a></li>
              <li><a href="mailto:jeshwar.work@gmail.com" class="hover:text-cyan-300 transition-colors">Security Disclosures</a></li>
            </ul>
          </div>
        </div>

        <div class="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
          <div>
            &copy; 2026 VigilAI Inc. All rights reserved. Architected by <strong class="text-slate-300">Eshwar J</strong>.
          </div>
          <div class="flex items-center gap-6">
            <a routerLink="/terms" class="hover:text-cyan-300 transition-colors">Terms</a>
            <a routerLink="/privacy" class="hover:text-cyan-300 transition-colors">Privacy</a>
            <a href="mailto:jeshwar.work@gmail.com" class="hover:text-cyan-300 transition-colors">Contact Support</a>
            <a href="https://github.com/Eshwar187/abuse-ring-sentinel" target="_blank" class="hover:text-cyan-300 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class LandingPageComponent {
  readonly activeSdkTab = signal<'node' | 'python' | 'curl'>('node');
}
