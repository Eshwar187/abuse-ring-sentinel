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
  Cpu,
  Database,
  Share2,
  Terminal,
  ChevronRight,
  Flame,
  Key,
} from 'lucide-angular';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      <!-- Cyber Ambient Glow Mesh -->
      <div class="fixed inset-0 pointer-events-none z-0">
        <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-transparent blur-[140px] rounded-full"></div>
        <div class="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full"></div>
        <div class="absolute bottom-10 left-10 w-[600px] h-[400px] bg-emerald-500/8 blur-[160px] rounded-full"></div>
      </div>

      <!-- Navigation Bar -->
      <header class="border-b border-slate-800/80 bg-[#060A14]/80 backdrop-blur-2xl sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="relative">
              <img src="vigilai_logo.jpg" alt="VigilAI Logo" class="w-11 h-11 rounded-xl shadow-lg shadow-cyan-500/25 object-cover border border-cyan-500/40" />
              <span class="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 border-2 border-[#060A14]"></span>
              </span>
            </div>
            <div>
              <span class="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>VigilAI</span>
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                  RISK ENGINE
                </span>
              </span>
              <p class="text-[10px] text-slate-400 font-mono">Autonomous Fraud & Ring Defense</p>
            </div>
          </div>

          <nav class="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
            <a href="#how-it-works" class="hover:text-cyan-300 transition-colors">How It Works</a>
            <a href="#graph-intelligence" class="hover:text-cyan-300 transition-colors">Graph Intelligence</a>
            <a href="#api" class="hover:text-cyan-300 transition-colors">Developer API</a>
            <a href="#architecture" class="hover:text-cyan-300 transition-colors">MySQL Architecture</a>
          </nav>

          <div class="flex items-center gap-3">
            <a
              routerLink="/demo"
              class="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-300 transition-all shadow-sm"
            >
              <lucide-icon name="play" [size]="12" class="text-amber-400"></lucide-icon>
              <span>6.9k Benchmark Demo</span>
            </a>
            <a
              routerLink="/login"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </a>
            <a
              routerLink="/signup"
              class="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
            >
              Start Free
            </a>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="relative pt-24 pb-20 md:pt-32 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center z-10">
        <div class="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-8 shadow-[0_0_20px_rgba(6,182,212,0.15)] font-mono">
          <span class="flex h-2 w-2 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          Next-Gen AI Merchant Collusion & Sybil Ring Shield
        </div>

        <h1 class="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-tight md:leading-[1.1]">
          Stop coordinated fraud rings <br />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 text-glow-cyan">
            before they strike.
          </span>
        </h1>

        <p class="mt-8 text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          VigilAI neutralizes distributed Sybil attacks, voucher harvesting, and card testing using 
          point-in-time velocity signals fused with heterogeneous entity graph correlation in real time.
        </p>

        <!-- CTA Buttons -->
        <div class="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
          <a
            routerLink="/signup"
            class="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-sm font-bold shadow-2xl shadow-cyan-500/30 transition-all hover:scale-105"
          >
            <span>Start Free Integration</span>
            <lucide-icon name="arrow-right" [size]="16"></lucide-icon>
          </a>
          <a
            routerLink="/demo"
            class="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#0B132B] hover:bg-[#111C38] border border-slate-700 hover:border-slate-600 text-slate-200 text-sm font-semibold transition-all hover:scale-105 shadow-xl"
          >
            <lucide-icon name="play" [size]="16" class="text-amber-400"></lucide-icon>
            <span>Launch Benchmark Demo (6.9k)</span>
          </a>
        </div>

        <!-- Metric Callouts -->
        <div class="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-400 font-mono">
          <span class="flex items-center gap-2"><span class="text-cyan-400 font-bold">✓</span> Sub-5ms Decision Latency</span>
          <span class="flex items-center gap-2"><span class="text-cyan-400 font-bold">✓</span> Strict Tenant Isolation</span>
          <span class="flex items-center gap-2"><span class="text-cyan-400 font-bold">✓</span> 100% Point-in-Time Causality</span>
          <span class="flex items-center gap-2"><span class="text-cyan-400 font-bold">✓</span> Cloud MySQL Persistent State</span>
        </div>
      </section>

      <!-- Interactive Threat Detection Architecture -->
      <section class="py-20 bg-[#060A14]/80 border-y border-slate-800/80 px-4 sm:px-6 lg:px-8 relative z-10" id="how-it-works">
        <div class="max-w-7xl mx-auto">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Why Single-Account Fraud Filters Fail</h2>
            <p class="text-sm text-slate-400 mt-3">
              Modern fraud syndicates distribute tiny micro-transactions across hundreds of fresh accounts, evading traditional velocity rules.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Flawed Legacy Approach -->
            <div class="bg-[#0B132B]/60 border border-rose-500/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div class="flex items-center gap-3 text-rose-400 font-bold text-sm uppercase tracking-wider mb-6 font-mono">
                <lucide-icon name="alert-triangle" [size]="20"></lucide-icon>
                <span>Traditional Per-Account Rules</span>
              </div>
              <ul class="space-y-4 text-xs text-slate-300">
                <li class="flex items-start gap-3">
                  <span class="text-rose-400 font-bold">✕</span>
                  <span>Evaluates each account in total isolation, blinded to shared devices and proxies.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-rose-400 font-bold">✕</span>
                  <span>Allows coordinated Sybil rings to drain promotion vouchers using distinct names.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-rose-400 font-bold">✕</span>
                  <span>High false-positive rate on legitimate returning customers.</span>
                </li>
              </ul>
              <div class="mt-6 p-4 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-300 text-xs font-mono">
                Result: ₹2.8M average monthly promo abuse loss
              </div>
            </div>

            <!-- VigilAI Graph Defense -->
            <div class="bg-gradient-to-br from-[#0B132B] to-[#080D1A] border border-cyan-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div class="flex items-center gap-3 text-cyan-300 font-bold text-sm uppercase tracking-wider mb-6 font-mono">
                <lucide-icon name="shield" [size]="20" class="text-cyan-400"></lucide-icon>
                <span>VigilAI Heterogeneous Graph Engine</span>
              </div>
              <ul class="space-y-4 text-xs text-slate-300">
                <li class="flex items-start gap-3">
                  <span class="text-cyan-400 font-bold">✓</span>
                  <span>Correlates Device Fingerprints, IPs, Payment Tokens, and Physical Addresses in real time.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-cyan-400 font-bold">✓</span>
                  <span>Detects Sybil ring collusion within 1 degree of network separation.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-cyan-400 font-bold">✓</span>
                  <span>Executes automated HMAC-signed actions directly to your merchant backend.</span>
                </li>
              </ul>
              <div class="mt-6 p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                Result: 99.4% ring detection rate with < 0.1% false-positive rate
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Developer API Code Section -->
      <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10" id="api">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono mb-4">
            <lucide-icon name="terminal" [size]="12"></lucide-icon>
            <span>INTEGRATION IN UNDER 5 MINUTES</span>
          </div>
          <h2 class="text-3xl font-extrabold text-white tracking-tight">API-First Developer Architecture</h2>
          <p class="text-xs text-slate-400 mt-2">Send a single JSON payload from your checkout backend to receive instantaneous risk decisions.</p>
        </div>

        <div class="rounded-3xl bg-[#060A14] border border-slate-800 shadow-2xl overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#080D1A]/90">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span class="ml-3 text-xs font-mono text-slate-400">POST /api/v1/risk/evaluate</span>
            </div>
            <span class="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-500/30">Node.js / Python / cURL</span>
          </div>
          
          <pre class="p-6 text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed bg-[#030712]"><code>import axios from 'axios';

// Evaluate inbound checkout transaction
const response = await axios.post('https://vigilai-api.onrender.com/api/v1/risk/evaluate', &#123;
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
  headers: &#123; 'X-API-Key': 'ars_live_••••••••••••' &#125;
&#125;);

console.log(response.data.decision);   // 'APPROVE' | 'REVIEW' | 'BLOCK'
console.log(response.data.risk_score); // 0.0124 (1.24% probability)
console.log(response.data.reasons);    // ['LOW_RISK_ESTABLISHED_ACCOUNT']</code></pre>
        </div>
      </section>

      <!-- Bottom CTA Banner -->
      <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center z-10">
        <div class="bg-gradient-to-b from-[#0B132B] via-[#080D1A] to-[#060A14] border border-cyan-500/30 rounded-3xl p-10 sm:p-16 shadow-2xl relative overflow-hidden">
          <div class="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to deploy autonomous fraud protection?
          </h2>
          <p class="mt-4 text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Get instant production credentials, real-time entity network visualization, and automated webhook defense.
          </p>
          <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              routerLink="/signup"
              class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-sm font-bold shadow-xl shadow-cyan-500/30 transition-all hover:scale-105"
            >
              Get Free API Credentials
            </a>
            <a
              routerLink="/demo"
              class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#030712] hover:bg-slate-900 text-slate-200 text-sm font-semibold border border-slate-700 transition-all hover:scale-105"
            >
              Explore 6.9k Benchmark Dataset
            </a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="mt-auto border-t border-slate-800/80 bg-[#060A14] py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 z-10">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img src="vigilai_logo.jpg" alt="VigilAI Logo" class="w-6 h-6 rounded-md object-cover border border-cyan-500/30" />
            <span class="font-bold text-cyan-400">VigilAI</span>
            <span>—</span>
            <span>Autonomous AI Cybersecurity & Fraud Ring Defense</span>
          </div>
          <div class="font-mono text-slate-500">
            Powered by Scikit-Learn GBDT, FastAPI, SQLAlchemy & Angular 20.
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class LandingPageComponent {}
