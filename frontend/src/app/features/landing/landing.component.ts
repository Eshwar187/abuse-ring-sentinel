import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Shield,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  Lock,
  Server,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-angular';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white font-sans">
      <!-- Navigation Bar -->
      <header class="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img src="vigilai_logo.jpg" alt="VigilAI Logo" class="w-10 h-10 rounded-xl shadow-lg shadow-cyan-500/25 object-cover border border-cyan-500/30" />
            <div>
              <span class="text-base font-bold tracking-tight text-white">VigilAI</span>
              <span class="ml-2 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                Risk Engine
              </span>
            </div>
          </div>

          <nav class="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
            <a href="#how-it-works" class="hover:text-white transition-colors">How It Works</a>
            <a href="#graph-intelligence" class="hover:text-white transition-colors">Graph Intelligence</a>
            <a href="#api" class="hover:text-white transition-colors">Developer API</a>
            <a href="#security" class="hover:text-white transition-colors">Security & Isolation</a>
          </nav>

          <div class="flex items-center gap-3">
            <a
              routerLink="/demo"
              class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            >
              <lucide-icon name="play" [size]="12" class="text-amber-400"></lucide-icon>
              View Live Demo
            </a>
            <a
              routerLink="/login"
              class="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </a>
            <a
              routerLink="/signup"
              class="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all hover:shadow-rose-600/40"
            >
              Start Free
            </a>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        <!-- Subtle Glow Background -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-rose-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium mb-6">
          <span class="flex h-2 w-2 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          API-First Coordinated Multi-Account Risk Management
        </div>

        <h1 class="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Stop coordinated payment abuse <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-300 to-amber-300">before it spreads.</span>
        </h1>

        <p class="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          VigilAI detects distributed Sybil syndicates, card testing rings, and voucher harvesting using 
          point-in-time behavioral velocity fused with heterogeneous entity relationship graphs.
        </p>

        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            routerLink="/signup"
            class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02]"
          >
            <span>Start Free Integration</span>
            <lucide-icon name="arrow-right" [size]="16"></lucide-icon>
          </a>
          <a
            routerLink="/demo"
            class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold transition-all hover:scale-[1.02]"
          >
            <lucide-icon name="play" [size]="14" class="text-amber-400"></lucide-icon>
            <span>Explore Demo Environment</span>
          </a>
        </div>

        <div class="mt-8 text-xs text-slate-400 flex items-center justify-center gap-6">
          <span>✓ Sub-5ms Decision Latency</span>
          <span>✓ Zero Point-in-Time Lookahead</span>
          <span>✓ Strict Tenant Isolation</span>
        </div>
      </section>

      <!-- Comparison: Isolated Classifiers vs Graph Intelligence -->
      <section class="py-16 bg-slate-900/40 border-y border-slate-800/80 px-4 sm:px-6 lg:px-8" id="how-it-works">
        <div class="max-w-7xl mx-auto">
          <div class="text-center max-w-3xl mx-auto mb-12">
            <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-white">Why Single-Transaction Fraud Filters Fail</h2>
            <p class="text-sm text-slate-400 mt-2">
              Modern abuse rings distribute low-value orders across hundreds of fresh user profiles, blinding per-account velocity rules.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Problem Card -->
            <div class="bg-slate-950/80 border border-rose-500/20 rounded-2xl p-6 sm:p-8">
              <div class="flex items-center gap-3 text-rose-400 font-bold text-sm uppercase tracking-wider mb-4">
                <lucide-icon name="alert-triangle" [size]="18"></lucide-icon>
                Traditional Velocity Classifiers
              </div>
              <ul class="space-y-4 text-xs sm:text-sm text-slate-300">
                <li class="flex items-start gap-3">
                  <span class="text-rose-400 shrink-0 font-bold">✗</span>
                  <span><strong>Sybil Blindness</strong>: Each fresh account only executes 1 checkout, passing single-account velocity thresholds.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-rose-400 shrink-0 font-bold">✗</span>
                  <span><strong>Household Over-declining</strong>: Blacklists entire IP subnets, falsely blocking innocent family members on shared Wi-Fi.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-rose-400 shrink-0 font-bold">✗</span>
                  <span><strong>Lookahead Contamination</strong>: Offline research models leak future graph connections ($t > T$).</span>
                </li>
              </ul>
            </div>

            <!-- Solution Card -->
            <div class="bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-6 sm:p-8">
              <div class="flex items-center gap-3 text-emerald-400 font-bold text-sm uppercase tracking-wider mb-4">
                <lucide-icon name="check-circle-2" [size]="18"></lucide-icon>
                Abuse-Ring Sentinel Engine
              </div>
              <ul class="space-y-4 text-xs sm:text-sm text-slate-300">
                <li class="flex items-start gap-3">
                  <span class="text-emerald-400 shrink-0 font-bold">✓</span>
                  <span><strong>Multi-Hop Bipartite Graphs</strong>: Dynamically correlates shared device fingerprints, payment tokens, and addresses in-memory.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-emerald-400 shrink-0 font-bold">✓</span>
                  <span><strong>Safe Shared Co-usage</strong>: Distinguishes legitimate residential Wi-Fi from malicious multi-account credential rotation.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-emerald-400 shrink-0 font-bold">✓</span>
                  <span><strong>Strict Temporal Causality</strong>: Every graph edge and behavioral window enforces $t < T$ strictly.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Key Pillars Section -->
      <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="graph-intelligence">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-white">Engineered for High-Throughput Digital Commerce</h2>
          <p class="text-sm text-slate-400 mt-2">
            A complete risk pipeline designed for payment gateways, digital merchants, and marketplace platforms.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Pillar 1 -->
          <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <lucide-icon name="layers" [size]="20"></lucide-icon>
            </div>
            <h3 class="text-base font-bold text-white mb-2">Automated 33-Feature Fusion</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Merchants send raw observable checkouts. The gateway derives 21 temporal behavioral velocity signals + 12 relational graph features automatically.
            </p>
          </div>

          <!-- Pillar 2 -->
          <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <lucide-icon name="zap" [size]="20"></lucide-icon>
            </div>
            <h3 class="text-base font-bold text-white mb-2">Sub-5ms GBDT Inference</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Powered by a frozen Histogram Gradient Boosted Decision Tree (HistGradientBoosting) operating with fixed decision thresholds ($\tau^* = 0.90$).
            </p>
          </div>

          <!-- Pillar 3 -->
          <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <lucide-icon name="lock" [size]="20"></lucide-icon>
            </div>
            <h3 class="text-base font-bold text-white mb-2">Strict Multi-Tenant Isolation</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Database tables, user graphs, and entity connections are strictly partitioned by Merchant ID. Zero cross-merchant data leakage.
            </p>
          </div>
        </div>
      </section>

      <!-- Code Snippet Section -->
      <section class="py-16 bg-slate-900/60 border-t border-slate-800 px-4 sm:px-6 lg:px-8" id="api">
        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-5 space-y-4">
            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
              <lucide-icon name="code-2" [size]="14"></lucide-icon>
              REST API v1 Gateway
            </div>
            <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-white">Integrate in Minutes, Not Months</h2>
            <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Send your raw checkout payloads directly to <code class="text-rose-300 font-mono">POST /api/v1/risk/evaluate</code>. Receive immediate risk probabilities, automated policy actions (<code class="text-emerald-400">APPROVE</code>, <code class="text-amber-400">REVIEW</code>, <code class="text-rose-400">BLOCK</code>), and ranked reason codes.
            </p>
            <div class="pt-2">
              <a
                routerLink="/signup"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
              >
                Create Sandbox Account
                <lucide-icon name="arrow-right" [size]="14"></lucide-icon>
              </a>
            </div>
          </div>

          <div class="lg:col-span-7 bg-slate-950 rounded-xl border border-slate-800 p-4 shadow-xl overflow-hidden">
            <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs text-slate-400 font-mono">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span class="ml-2 text-slate-300">checkout_evaluation.ts</span>
              </div>
              <span>POST /api/v1/risk/evaluate</span>
            </div>
            <pre class="text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed p-2"><code>import axios from 'axios';

const risk = await axios.post('https://api.abuse-sentinel.io/api/v1/risk/evaluate', &#123;
  transaction_id: 'tx_checkout_8829',
  user_id: 'cust_98124',
  amount: 349.00,
  currency: 'INR',
  timestamp: new Date().toISOString(),
  device_id: 'dev_fingerprint_881',
  ip_address: '198.51.100.22',
  payment_method_id: 'pm_card_tok_99',
  email_domain: 'buyer&#64;gmail.com',
  promo_code: 'WELCOME50'
&#125;, &#123;
  headers: &#123; 'X-API-Key': 'ars_live_••••••••••••' &#125;
&#125;);

console.log(risk.data.decision);   // 'APPROVE' | 'REVIEW' | 'BLOCK'
console.log(risk.data.risk_score); // 0.0124 (1.24%)</code></pre>
          </div>
        </div>
      </section>

      <!-- Bottom CTA Banner -->
      <section class="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div class="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <h2 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to secure your merchant checkout?
          </h2>
          <p class="mt-3 text-sm text-slate-400 max-w-xl mx-auto">
            Get instant access to live risk scoring, entity graph visualization, and explainable dispute defense.
          </p>
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              routerLink="/signup"
              class="w-full sm:w-auto px-6 py-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
            >
              Get API Credentials
            </a>
            <a
              routerLink="/demo"
              class="w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all"
            >
              Try Historical Demo Mode
            </a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="font-bold text-cyan-400">VigilAI</span>
            <span>—</span>
            <span>Autonomous Fraud Defense & Coordinated Ring Detection</span>
          </div>
          <div>
            Built with Scikit-Learn GBDT, FastAPI, and Angular 20.
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class LandingPageComponent {}
