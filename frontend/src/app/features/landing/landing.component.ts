import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      <!-- Cyber Ambient Glow Mesh -->
      <div class="fixed inset-0 pointer-events-none z-0">
        <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-transparent blur-[140px] rounded-full"></div>
        <div class="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full"></div>
        <div class="absolute bottom-10 left-10 w-[600px] h-[400px] bg-emerald-500/8 blur-[160px] rounded-full"></div>
      </div>

      <!-- Navigation Bar -->
      <header class="border-b border-slate-800/80 bg-[#060A14]/90 backdrop-blur-2xl sticky top-0 z-50 py-3">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <!-- Left Logo & Brand -->
          <div class="flex items-center gap-3.5">
            <div class="relative flex items-center shrink-0">
              <img src="vigilai_logo.jpg" alt="VigilAI Logo" class="w-10 h-10 rounded-xl shadow-lg shadow-cyan-500/25 object-cover border border-cyan-500/40" />
              <span class="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 border-2 border-[#060A14]"></span>
              </span>
            </div>
            <div class="flex flex-col justify-center">
              <div class="flex items-center gap-2 leading-none">
                <span class="text-base font-extrabold tracking-tight text-white">VigilAI</span>
                <span class="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                  RISK ENGINE
                </span>
              </div>
              <p class="text-[10px] text-slate-400 font-mono mt-1 leading-none">Autonomous Fraud & Ring Defense</p>
            </div>
          </div>

          <!-- Center Nav Links -->
          <nav class="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
            <a href="#how-it-works" class="hover:text-cyan-300 transition-colors">How It Works</a>
            <a href="#api" class="hover:text-cyan-300 transition-colors">Developer API</a>
            <a href="#about-developer" class="hover:text-cyan-300 transition-colors text-cyan-400 font-semibold">About Developer</a>
            <a href="#architecture" class="hover:text-cyan-300 transition-colors">Architecture</a>
          </nav>

          <!-- Right Actions -->
          <div class="flex items-center gap-3">
            <a
              routerLink="/demo"
              class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-300 transition-all shadow-sm"
            >
              <span>▶ 6.9k Benchmark Demo</span>
            </a>
            <a
              routerLink="/login"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </a>
            <a
              routerLink="/signup"
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-black text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
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
            <span>Start Free Integration →</span>
          </a>
          <a
            routerLink="/demo"
            class="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#0B132B] hover:bg-[#111C38] border border-slate-700 hover:border-slate-600 text-slate-200 text-sm font-semibold transition-all hover:scale-105 shadow-xl"
          >
            <span>▶ Launch Benchmark Demo (6.9k)</span>
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
                <svg class="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
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
                <svg class="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
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
            <span>⚡ INTEGRATION IN UNDER 5 MINUTES</span>
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
  headers: &#123; 'X-API-Key': 'ars_live_••••••••••••' &#125;
&#125;);

console.log(response.data.decision);   // 'APPROVE' | 'REVIEW' | 'BLOCK'
console.log(response.data.risk_score); // 0.0124 (1.24% probability)
console.log(response.data.reasons);    // ['LOW_RISK_ESTABLISHED_ACCOUNT']</code></pre>
        </div>
      </section>

      <!-- MEET THE ARCHITECT / ABOUT DEVELOPER SECTION -->
      <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10" id="about-developer">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono mb-4 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <span class="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            <span>CREATOR & AI ARCHITECT</span>
          </div>
          <h2 class="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Meet the Developer
          </h2>
          <p class="text-sm text-slate-400 mt-2">
            Engineering autonomous machine learning systems and high-throughput cybersecurity infrastructure.
          </p>
        </div>

        <div class="bg-gradient-to-r from-[#0B132B] via-[#080D1A] to-[#060A14] border border-cyan-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          <div class="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <!-- Left Avatar Profile Card -->
            <div class="lg:col-span-4 flex flex-col items-center text-center p-6 rounded-2xl bg-[#030712]/80 border border-slate-800 shadow-xl">
              <div class="relative mb-4">
                <div class="w-28 h-28 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-1 shadow-[0_0_25px_rgba(6,182,212,0.35)]">
                  <div class="w-full h-full rounded-xl bg-[#060A14] flex items-center justify-center text-3xl font-black font-mono text-cyan-300">
                    EJ
                  </div>
                </div>
                <span class="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#060A14]"></span>
                </span>
              </div>

              <h3 class="text-xl font-extrabold text-white">Eshwar J</h3>
              <p class="text-xs text-cyan-400 font-mono mt-0.5">Lead AI & Systems Engineer</p>
              
              <div class="mt-4 flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-mono border border-cyan-500/25">
                  Creator of VigilAI
                </span>
              </div>

              <!-- Quick Links -->
              <div class="mt-6 flex flex-col w-full gap-2 text-xs font-mono">
                <a
                  href="https://github.com/Eshwar187"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all"
                >
                  <span>GitHub: &#64;Eshwar187</span>
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <a
                  href="mailto:jeshwar.work@gmail.com"
                  class="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all"
                >
                  <span>jeshwar.work&#64;gmail.com</span>
                </a>
              </div>
            </div>

            <!-- Right Bio & Tech Stack Grid -->
            <div class="lg:col-span-8 space-y-6">
              <div>
                <h4 class="text-xl font-bold text-white tracking-tight">
                  Building Autonomous AI Defense Against Coordinated Fraud
                </h4>
                <p class="text-xs text-slate-300 mt-2 leading-relaxed">
                  I designed and developed <strong>VigilAI</strong> to address the blind spots in traditional single-account fraud detection. By combining <strong>zero-leakage point-in-time causality</strong>, <strong>heterogeneous entity collusion graphs</strong>, and <strong>gradient-boosted decision trees (Model F)</strong>, VigilAI shuts down distributed Sybil attacks and promo voucher syndicates in sub-5ms latency.
                </p>
              </div>

              <!-- 4 Architecture Mastery Badges -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div class="p-3.5 rounded-2xl bg-[#030712]/70 border border-slate-800 hover:border-cyan-500/30 transition-colors">
                  <div class="text-xs font-bold text-cyan-300 font-mono flex items-center gap-2">
                    <span>🧠 Machine Learning Core</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-1">
                    33 point-in-time features, HistGradientBoosting (Model F), optimal cost threshold $\\tau^* = 0.90$.
                  </p>
                </div>

                <div class="p-3.5 rounded-2xl bg-[#030712]/70 border border-slate-800 hover:border-purple-500/30 transition-colors">
                  <div class="text-xs font-bold text-purple-300 font-mono flex items-center gap-2">
                    <span>🕸️ Graph & Collusion Engine</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-1">
                    Multi-entity bipartite graphs (Device, IP, Cards, Addresses) with real-time network ring clustering.
                  </p>
                </div>

                <div class="p-3.5 rounded-2xl bg-[#030712]/70 border border-slate-800 hover:border-blue-500/30 transition-colors">
                  <div class="text-xs font-bold text-blue-300 font-mono flex items-center gap-2">
                    <span>⚡ Cloud Microservices</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-1">
                    Python FastAPI async endpoints, Render deployment, Aiven MySQL TLS state persistence.
                  </p>
                </div>

                <div class="p-3.5 rounded-2xl bg-[#030712]/70 border border-slate-800 hover:border-emerald-500/30 transition-colors">
                  <div class="text-xs font-bold text-emerald-300 font-mono flex items-center gap-2">
                    <span>🎨 Cyber-Kinetic UI</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-1">
                    Modern Angular 20 Standalone architecture, Cytoscape graph renderer, and ECharts analytics.
                  </p>
                </div>
              </div>

              <!-- Open Source Banner -->
              <div class="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span class="text-slate-300 font-mono">
                  Explore the open-source repository on GitHub
                </span>
                <a
                  href="https://github.com/Eshwar187/abuse-ring-sentinel"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono transition-all shrink-0 shadow-md shadow-cyan-500/20"
                >
                  View Repo on GitHub →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Bottom CTA Banner -->
      <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center z-10" id="architecture">
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
            <span>Created by <strong class="text-white">Eshwar J</strong> (<a href="https://github.com/Eshwar187" target="_blank" class="text-cyan-300 hover:underline">&#64;Eshwar187</a>)</span>
          </div>
          <div class="font-mono text-slate-500">
            Powered by Scikit-Learn GBDT, FastAPI, Aiven MySQL & Angular 20.
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class LandingPageComponent {}
