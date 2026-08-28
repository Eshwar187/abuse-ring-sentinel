import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface AttackScenario {
  id: 'sybil' | 'card_test' | 'ato' | 'legit';
  name: string;
  badge: string;
  description: string;
  user: string;
  amount: string;
  device: string;
  ip: string;
  entitiesShared: string;
  velocity: string;
  collusionIndex: string;
  riskScore: number;
  decision: 'BLOCK' | 'REVIEW' | 'APPROVE';
  action: string;
  reasons: string[];
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#07080B] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased relative overflow-x-hidden">
      
      <!-- Refined Architectural Grid & Ambient Spotlight -->
      <div class="fixed inset-0 pointer-events-none z-0">
        <!-- Top subtle spotlight glow -->
        <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-violet-600/5 to-transparent blur-[140px] rounded-full"></div>
        <div class="absolute top-[40%] -right-40 w-[600px] h-[600px] bg-blue-600/5 blur-[160px] rounded-full"></div>
        <div class="absolute bottom-[20%] -left-40 w-[600px] h-[600px] bg-emerald-600/4 blur-[160px] rounded-full"></div>
        
        <!-- Precision Dot Matrix Pattern -->
        <div class="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
      </div>

      <!-- Sleek Enterprise Navigation Bar -->
      <header class="border-b border-white/[0.06] bg-[#07080B]/80 backdrop-blur-xl sticky top-0 z-50 py-3 transition-all">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          <!-- Brand Logo & Identity -->
          <a routerLink="/" class="flex items-center gap-3.5 group cursor-pointer">
            <div class="relative flex items-center shrink-0">
              <img 
                src="vigilai_logo.jpg" 
                alt="VigilAI Logo" 
                class="w-8 h-8 rounded-lg shadow-sm object-cover border border-white/10 group-hover:border-indigo-500/50 transition-all duration-300" 
              />
              <span class="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 border border-[#07080B]"></span>
              </span>
            </div>
            <div class="flex flex-col justify-center">
              <div class="flex items-center gap-2 leading-tight">
                <span class="text-[15px] font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">VigilAI</span>
                <span class="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-mono">
                  v2.4
                </span>
              </div>
              <p class="text-[11px] text-zinc-400 font-normal">Autonomous Fraud Ring Defense</p>
            </div>
          </a>

          <!-- Navigation Links -->
          <nav class="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
            <a href="#how-it-works" class="hover:text-white transition-colors">Graph Engine</a>
            <a href="#simulator" class="hover:text-white transition-colors">Live Simulator</a>
            <a href="#sdk" class="hover:text-white transition-colors">API & SDK</a>
            <a href="#developer" class="hover:text-white transition-colors flex items-center gap-1.5">
              <span>Architect</span>
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            </a>
          </nav>

          <!-- Action Buttons -->
          <div class="flex items-center gap-3">
            <a
              routerLink="/demo"
              class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <svg class="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>6.9k Benchmark</span>
            </a>
            <a
              routerLink="/login"
              class="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </a>
            <a
              routerLink="/signup"
              class="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm hover:shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Get API Keys
            </a>
          </div>
        </div>
      </header>

      <!-- HERO SECTION -->
      <section class="relative pt-16 pb-14 md:pt-24 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div class="text-center max-w-4xl mx-auto">
          
          <!-- Announcement Pill -->
          <div class="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs font-medium mb-6 shadow-sm hover:border-zinc-700 transition-colors">
            <span class="flex h-2 w-2 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>Heterogeneous Bipartite Graph Engine + Model F</span>
            <span class="text-zinc-600 font-mono">|</span>
            <span class="text-indigo-400 font-mono text-[11px]">Sub-5ms Verdict</span>
          </div>

          <!-- Hero Headline -->
          <h1 class="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Neutralize Coordinated Fraud Rings <br class="hidden sm:inline" />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-300 to-indigo-300">
              Before Payment Settlement.
            </span>
          </h1>

          <!-- Subtitle -->
          <p class="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Single-account velocity checks are blind to distributed syndicates. VigilAI correlates 
            <strong>33 point-in-time features</strong> across dynamic entity graphs to detect Sybil attacks, voucher harvesting, and card testing in real time.
          </p>

          <!-- CTAs & Real Git Clone -->
          <div class="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              routerLink="/signup"
              class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Get API Credentials Free →</span>
            </a>
            
            <button
              type="button"
              (click)="copyGitCloneCommand()"
              class="w-full sm:w-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 text-zinc-300 font-mono text-xs transition-all cursor-pointer group"
            >
              <span class="text-zinc-500 select-none">$</span>
              <span class="text-zinc-200">git clone https://github.com/Eshwar187/abuse-ring-sentinel.git</span>
              <span class="text-[11px] text-zinc-400 group-hover:text-white transition-colors">
                {{ copiedCli() ? '✓ Copied' : 'Copy' }}
              </span>
            </button>
          </div>

          <!-- Enterprise Metrics Bar -->
          <div class="mt-12 pt-8 border-t border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            <div class="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.04]">
              <div class="text-2xl font-bold text-white font-mono tracking-tight">&lt; 4.2ms</div>
              <div class="text-xs text-zinc-400 mt-0.5">P99 Inference Latency</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.04]">
              <div class="text-2xl font-bold text-emerald-400 font-mono tracking-tight">99.4%</div>
              <div class="text-xs text-zinc-400 mt-0.5">Syndicate Ring Detection</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.04]">
              <div class="text-2xl font-bold text-indigo-400 font-mono tracking-tight">0.00%</div>
              <div class="text-xs text-zinc-400 mt-0.5">Point-in-Time Data Leakage</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.04]">
              <div class="text-2xl font-bold text-zinc-200 font-mono tracking-tight">13 Tables</div>
              <div class="text-xs text-zinc-400 mt-0.5">Multi-Tenant MySQL Architecture</div>
            </div>
          </div>
        </div>

        <!-- INTERACTIVE LIVE FRAUD RADAR & SIMULATOR CARD -->
        <div class="mt-14 max-w-5xl mx-auto rounded-2xl bg-zinc-900/70 border border-zinc-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden" id="simulator">
          
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 class="text-sm font-bold text-white tracking-tight">Real-Time Evaluation Sandbox</h3>
              </div>
              <p class="text-xs text-zinc-400 mt-0.5">Select an attack pattern below to observe Model F & bipartite entity graph inference</p>
            </div>
            
            <!-- Scenario Selector Pills -->
            <div class="flex flex-wrap items-center gap-1.5 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                *ngFor="let s of scenarios"
                (click)="selectScenario(s.id)"
                [class.bg-indigo-600]="activeScenario() === s.id"
                [class.text-white]="activeScenario() === s.id"
                [class.text-zinc-400]="activeScenario() !== s.id"
                class="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
              >
                {{ s.name }}
              </button>
            </div>
          </div>

          <!-- Dynamic Sandbox Execution Deck -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-start text-xs">
            
            <!-- Col 1: Transaction Ingestion Stream -->
            <div class="lg:col-span-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
              <div class="flex items-center justify-between border-b border-zinc-800/60 pb-2.5">
                <span class="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">1. Inbound Ingestion</span>
                <span class="text-[10px] font-mono text-zinc-500">0.7ms</span>
              </div>
              
              <div class="space-y-1.5 font-mono text-[11px] text-zinc-300">
                <div class="text-zinc-500"><span class="text-indigo-400 font-bold">POST</span> /api/v1/risk/evaluate</div>
                <div class="flex justify-between">
                  <span class="text-zinc-400">User:</span>
                  <span class="text-zinc-100 font-semibold">{{ currentScenario().user }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-400">Amount:</span>
                  <span class="text-emerald-400 font-bold">{{ currentScenario().amount }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-400">Device ID:</span>
                  <span class="text-zinc-300">{{ currentScenario().device }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-400">IP Geolocation:</span>
                  <span class="text-zinc-300">{{ currentScenario().ip }}</span>
                </div>
              </div>

              <div class="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 leading-relaxed">
                {{ currentScenario().description }}
              </div>
            </div>

            <!-- Col 2: Point-in-Time Features & Graph Signals -->
            <div class="lg:col-span-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
              <div class="flex items-center justify-between border-b border-zinc-800/60 pb-2.5">
                <span class="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">2. Entity Graph & 33 Features</span>
                <span class="text-[10px] font-mono text-zinc-500">1.9ms</span>
              </div>

              <div class="space-y-2 font-mono text-[11px]">
                <div class="flex justify-between items-center p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                  <span class="text-zinc-400">Shared Entity Degree:</span>
                  <span class="font-bold" [ngClass]="getScoreColorClass()">
                    {{ currentScenario().entitiesShared }}
                  </span>
                </div>
                <div class="flex justify-between items-center p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                  <span class="text-zinc-400">Velocity (10m):</span>
                  <span class="font-bold text-zinc-200">{{ currentScenario().velocity }}</span>
                </div>
                <div class="flex justify-between items-center p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                  <span class="text-zinc-400">Collusion Density:</span>
                  <span class="font-bold text-zinc-200">{{ currentScenario().collusionIndex }}</span>
                </div>
              </div>

              <div class="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                <span class="text-zinc-500">Causality:</span>
                <span class="text-emerald-400 font-mono font-medium">✓ Strictly t &lt; t_pred</span>
              </div>
            </div>

            <!-- Col 3: Automated Verdict & Mitigation Action -->
            <div class="lg:col-span-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
              <div class="flex items-center justify-between border-b border-zinc-800/60 pb-2.5">
                <span class="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">3. Cost-Optimal Policy</span>
                <span class="text-[10px] font-mono text-zinc-500">1.2ms</span>
              </div>

              <div class="p-3 rounded-lg border space-y-2 font-mono" [ngClass]="getVerdictCardClass()">
                
                <div class="flex items-center justify-between">
                  <span class="text-xs text-zinc-400">Risk Score:</span>
                  <span class="text-sm font-bold font-mono" [ngClass]="getScoreColorClass()">
                    {{ currentScenario().riskScore.toFixed(4) }}
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs text-zinc-400">Verdict:</span>
                  <span class="px-2 py-0.5 rounded text-xs font-black tracking-wide" [ngClass]="getVerdictBadgeClass()">
                    {{ currentScenario().decision }}
                  </span>
                </div>

                <div class="text-[10px] text-zinc-400 pt-1 border-t border-white/[0.06]">
                  Action: <span class="text-zinc-200 font-semibold">{{ currentScenario().action }}</span>
                </div>
              </div>

              <!-- Reason Codes -->
              <div class="space-y-1">
                <div class="text-[10px] uppercase font-mono text-zinc-500">Reason Evidence:</div>
                <div class="flex flex-wrap gap-1">
                  <span *ngFor="let r of currentScenario().reasons" class="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px] font-mono">
                    {{ r }}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- HOW VIGILAI SOLVES FRAUD (ARCHITECTURE COMPARISON) -->
      <section class="py-16 md:py-24 bg-zinc-950/70 border-y border-white/[0.06] px-4 sm:px-6 lg:px-8 relative z-10" id="how-it-works">
        <div class="max-w-7xl mx-auto">
          
          <div class="text-center max-w-3xl mx-auto mb-14">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono mb-3">
              <span>SYSTEM ARCHITECTURE</span>
            </div>
            <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Why Traditional Rules Leak Millions
            </h2>
            <p class="text-sm text-zinc-400 mt-2">
              Legacy anti-fraud engines evaluate transactions in isolation. Fraud rings defeat them by distributing velocity across hundreds of fresh accounts.
            </p>
          </div>

          <!-- Feature Grid Comparison -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <!-- Left: Legacy Siloed Checks -->
            <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-7 space-y-6">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-sm">
                  ✕
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white tracking-tight">Isolated Account Heuristics</h4>
                  <p class="text-xs text-zinc-400">Traditional single-account rules</p>
                </div>
              </div>

              <div class="space-y-3.5 text-xs text-zinc-300">
                <div class="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                  <div class="font-semibold text-zinc-200">Siloed Velocity Windows</div>
                  <div class="text-zinc-400 mt-0.5">Counts orders strictly for user_id; blind when 50 new users share the same subnet and hardware fingerprint.</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                  <div class="font-semibold text-zinc-200">Voucher & Promo Abuse Drainage</div>
                  <div class="text-zinc-400 mt-0.5">Syndicates register separate emails to repeatedly redeem high-discount new-customer coupons.</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                  <div class="font-semibold text-zinc-200">Excessive False Positives</div>
                  <div class="text-zinc-400 mt-0.5">Arbitrary velocity rules reject high-intent legitimate buyers on VPNs or shared workplace networks.</div>
                </div>
              </div>
            </div>

            <!-- Right: VigilAI Bipartite Graph & GBDT Core -->
            <div class="bg-gradient-to-b from-indigo-950/20 via-zinc-900/60 to-zinc-900/50 border border-indigo-500/30 rounded-2xl p-7 space-y-6 shadow-lg shadow-indigo-950/20">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  ✓
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white tracking-tight">VigilAI Autonomous Graph Engine</h4>
                  <p class="text-xs text-indigo-300">Bipartite correlation + Cost-optimal ML</p>
                </div>
              </div>

              <div class="space-y-3.5 text-xs text-zinc-300">
                <div class="p-3 rounded-xl bg-zinc-950/80 border border-indigo-500/20">
                  <div class="font-semibold text-white">Heterogeneous Entity Linkage</div>
                  <div class="text-zinc-400 mt-0.5">Links User, Device, IP, Payment Token, and Address nodes into dynamic bipartite projection subgraphs.</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-950/80 border border-indigo-500/20">
                  <div class="font-semibold text-white">Zero Point-in-Time Data Leakage</div>
                  <div class="text-zinc-400 mt-0.5">Guaranteed mathematical causality: all 33 features derived strictly before checkout without future bias.</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-950/80 border border-indigo-500/20">
                  <div class="font-semibold text-white">Automated Webhook Mitigation</div>
                  <div class="text-zinc-400 mt-0.5">Dispatches signed HMAC-SHA256 webhooks to automatically freeze orders, cancel vouchers, or trigger 2FA.</div>
                </div>
              </div>
            </div>

          </div>

          <!-- 4 Architecture Pillars -->
          <div class="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="p-5 rounded-xl bg-zinc-900/40 border border-white/[0.06] space-y-2">
              <div class="text-base font-bold text-white flex items-center gap-2">
                <span class="text-indigo-400">01</span> Bipartite Graphs
              </div>
              <p class="text-xs text-zinc-400 leading-relaxed">
                Computes component user degree, shared entity cardinality, and network clustering density across all identity dimensions.
              </p>
            </div>
            
            <div class="p-5 rounded-xl bg-zinc-900/40 border border-white/[0.06] space-y-2">
              <div class="text-base font-bold text-white flex items-center gap-2">
                <span class="text-indigo-400">02</span> 33 Point-in-Time Signals
              </div>
              <p class="text-xs text-zinc-400 leading-relaxed">
                Extracts rolling velocity (1h, 24h, 7d), tenure, promo ratios, and mean amount z-scores strictly isolated before checkout.
              </p>
            </div>

            <div class="p-5 rounded-xl bg-zinc-900/40 border border-white/[0.06] space-y-2">
              <div class="text-base font-bold text-white flex items-center gap-2">
                <span class="text-indigo-400">03</span> Model F (HistGBDT)
              </div>
              <p class="text-xs text-zinc-400 leading-relaxed">
                Trained on real financial fraud distributions, evaluated under cost-asymmetric policy to minimize false rejections.
              </p>
            </div>

            <div class="p-5 rounded-xl bg-zinc-900/40 border border-white/[0.06] space-y-2">
              <div class="text-base font-bold text-white flex items-center gap-2">
                <span class="text-indigo-400">04</span> Enterprise Cloud Persistence
              </div>
              <p class="text-xs text-zinc-400 leading-relaxed">
                Normalized 13-table SQLAlchemy architecture across MySQL & SQLite with self-healing automatic failover recovery.
              </p>
            </div>
          </div>

        </div>
      </section>

      <!-- DEVELOPER SDK SECTION -->
      <section class="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10" id="sdk">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono mb-3">
            <span>DEVELOPER EXPERIENCE</span>
          </div>
          <h2 class="text-3xl font-extrabold text-white tracking-tight">API-First Checkout Integration</h2>
          <p class="text-xs text-zinc-400 mt-2">Send canonical transaction payloads from your API to receive instantaneous, explainable risk decisions.</p>
        </div>

        <!-- Code Terminal -->
        <div class="rounded-2xl bg-[#0B0C10] border border-zinc-800 shadow-2xl overflow-hidden">
          
          <!-- Terminal Header -->
          <div class="flex items-center justify-between px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/80 flex-wrap gap-3">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
              <span class="ml-2 text-xs font-mono text-zinc-400">POST /api/v1/risk/evaluate</span>
            </div>

            <!-- Tab Switcher & Copy Button -->
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 font-mono text-xs">
                <button
                  type="button"
                  (click)="activeSdkTab.set('node')"
                  [class.bg-zinc-800]="activeSdkTab() === 'node'"
                  [class.text-white]="activeSdkTab() === 'node'"
                  [class.text-zinc-400]="activeSdkTab() !== 'node'"
                  class="px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Node.js / TS
                </button>
                <button
                  type="button"
                  (click)="activeSdkTab.set('python')"
                  [class.bg-zinc-800]="activeSdkTab() === 'python'"
                  [class.text-white]="activeSdkTab() === 'python'"
                  [class.text-zinc-400]="activeSdkTab() !== 'python'"
                  class="px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Python
                </button>
                <button
                  type="button"
                  (click)="activeSdkTab.set('curl')"
                  [class.bg-zinc-800]="activeSdkTab() === 'curl'"
                  [class.text-white]="activeSdkTab() === 'curl'"
                  [class.text-zinc-400]="activeSdkTab() !== 'curl'"
                  class="px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer"
                >
                  cURL
                </button>
              </div>

              <button
                type="button"
                (click)="copyCodeSnippet()"
                class="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                {{ copiedSdk() ? '✓ Copied' : 'Copy' }}
              </button>
            </div>
          </div>

          <!-- Code Content -->
          <div class="p-5 text-xs font-mono overflow-x-auto bg-[#07080B]">
            <pre *ngIf="activeSdkTab() === 'node'" class="text-zinc-300 leading-relaxed"><code><span class="text-indigo-400">import</span> axios <span class="text-indigo-400">from</span> <span class="text-emerald-300">'axios'</span>;

<span class="text-zinc-500">// Evaluate checkout event with sub-5ms decision return</span>
<span class="text-indigo-400">const</span> response = <span class="text-indigo-400">await</span> axios.post(<span class="text-emerald-300">'https://vigil-ai-f0ev.onrender.com/api/v1/risk/evaluate'</span>, &#123;
  transaction_id: <span class="text-emerald-300">'tx_order_88192'</span>,
  user_id: <span class="text-emerald-300">'usr_buyer_4401'</span>,
  amount: <span class="text-amber-300">499.00</span>,
  currency: <span class="text-emerald-300">'INR'</span>,
  timestamp: <span class="text-indigo-300">new</span> Date().toISOString(),
  device_id: <span class="text-emerald-300">'dev_fp_x99a'</span>,
  ip_address: <span class="text-emerald-300">'198.51.100.22'</span>,
  payment_method_id: <span class="text-emerald-300">'pm_tok_99182'</span>,
  promo_code: <span class="text-emerald-300">'WELCOME50'</span>
&#125;, &#123;
  headers: &#123; <span class="text-emerald-300">'X-API-Key'</span>: <span class="text-amber-300">'ars_live_••••••••••••••••'</span> &#125;
&#125;);

console.log(response.data.decision);   <span class="text-zinc-500">// 'APPROVE' | 'REVIEW' | 'BLOCK'</span>
console.log(response.data.risk_score); <span class="text-zinc-500">// 0.9842</span>
console.log(response.data.reason_codes); <span class="text-zinc-500">// ['DEVICE_PRIOR_USER_CARDINALITY_HIGH']</span></code></pre>

            <pre *ngIf="activeSdkTab() === 'python'" class="text-zinc-300 leading-relaxed"><code><span class="text-indigo-400">import</span> requests
<span class="text-indigo-400">from</span> datetime <span class="text-indigo-400">import</span> datetime, timezone

payload = &#123;
    <span class="text-emerald-300">"transaction_id"</span>: <span class="text-emerald-300">"tx_order_88192"</span>,
    <span class="text-emerald-300">"user_id"</span>: <span class="text-emerald-300">"usr_buyer_4401"</span>,
    <span class="text-emerald-300">"amount"</span>: <span class="text-amber-300">499.00</span>,
    <span class="text-emerald-300">"currency"</span>: <span class="text-emerald-300">"INR"</span>,
    <span class="text-emerald-300">"timestamp"</span>: datetime.now(timezone.utc).isoformat(),
    <span class="text-emerald-300">"device_id"</span>: <span class="text-emerald-300">"dev_fp_x99a"</span>,
    <span class="text-emerald-300">"ip_address"</span>: <span class="text-emerald-300">"198.51.100.22"</span>,
    <span class="text-emerald-300">"payment_method_id"</span>: <span class="text-emerald-300">"pm_tok_99182"</span>,
    <span class="text-emerald-300">"promo_code"</span>: <span class="text-emerald-300">"WELCOME50"</span>
&#125;

headers = &#123;<span class="text-emerald-300">"X-API-Key"</span>: <span class="text-amber-300">"ars_live_••••••••••••••••"</span>&#125;
resp = requests.post(<span class="text-emerald-300">"https://vigil-ai-f0ev.onrender.com/api/v1/risk/evaluate"</span>, json=payload, headers=headers)
result = resp.json()

print(<span class="text-emerald-300">"Decision:"</span>, result[<span class="text-emerald-300">"decision"</span>])     <span class="text-zinc-500"># BLOCK</span>
print(<span class="text-emerald-300">"Risk Score:"</span>, result[<span class="text-emerald-300">"risk_score"</span>]) <span class="text-zinc-500"># 0.9842</span></code></pre>

            <pre *ngIf="activeSdkTab() === 'curl'" class="text-zinc-300 leading-relaxed"><code>curl -X POST <span class="text-emerald-300">"https://vigil-ai-f0ev.onrender.com/api/v1/risk/evaluate"</span> \
  -H <span class="text-emerald-300">"Content-Type: application/json"</span> \
  -H <span class="text-emerald-300">"X-API-Key: ars_live_••••••••••••••••"</span> \
  -d <span class="text-amber-300">'&#123;
    "transaction_id": "tx_order_88192",
    "user_id": "usr_buyer_4401",
    "amount": 499.00,
    "currency": "INR",
    "timestamp": "2026-08-28T09:00:00Z",
    "device_id": "dev_fp_x99a",
    "ip_address": "198.51.100.22",
    "payment_method_id": "pm_tok_99182",
    "promo_code": "WELCOME50"
  &#125;'</span></code></pre>
          </div>
        </div>
      </section>

      <!-- MEET THE ARCHITECT & DEVELOPER SECTION -->
      <section class="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10" id="developer">
        
        <div class="text-center max-w-3xl mx-auto mb-14">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono mb-3">
            <span>SYSTEMS ARCHITECT</span>
          </div>
          <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered by Eshwar J
          </h2>
          <p class="text-sm text-zinc-400 mt-2">
            Application Security, Autonomous Defense Architectures & Scalable Distributed Backend Systems.
          </p>
        </div>

        <div class="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-7 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Left Portrait & Identity Card -->
            <div class="lg:col-span-4 flex flex-col items-center text-center p-6 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
              
              <!-- Clean Verified Photo -->
              <div class="relative mb-4">
                <div class="w-32 h-32 rounded-xl p-0.5 bg-zinc-800 border border-zinc-700 shadow-md">
                  <img
                    src="eshwar_photo.jpg"
                    alt="Eshwar J - Systems Engineer"
                    class="w-full h-full rounded-[10px] object-cover"
                  />
                </div>
                <span class="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-zinc-950"></span>
                </span>
              </div>

              <h3 class="text-xl font-bold text-white tracking-tight">Eshwar J</h3>
              <p class="text-xs text-indigo-400 font-mono font-medium mt-0.5">AppSec & AI Systems Engineer</p>
              
              <div class="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-mono">
                <span class="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                  SRM University (CGPA 9.19)
                </span>
                <span class="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                  Graduating 2027
                </span>
              </div>

              <!-- Quick Contact Links -->
              <div class="mt-5 flex flex-col w-full gap-2 text-xs font-mono">
                <a
                  href="https://github.com/Eshwar187"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <svg class="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub: &#64;Eshwar187</span>
                </a>
                <a
                  href="mailto:jeshwar.work@gmail.com"
                  class="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>jeshwar.work&#64;gmail.com</span>
                </a>
              </div>
            </div>

            <!-- Right: Experience, Technical Stack & Highlights -->
            <div class="lg:col-span-8 space-y-6">
              <div>
                <h4 class="text-lg font-bold text-white tracking-tight">
                  Design Philosophy: Zero-Trust Security & Mathematical Causality
                </h4>
                <p class="text-xs text-zinc-300 mt-2 leading-relaxed">
                  I designed <strong>VigilAI</strong> to bridge the gap between academic graph theory and high-throughput financial infrastructure. By fusing bipartite entity clustering with 33 point-in-time features in a non-linear gradient-boosted decision tree, VigilAI neutralizes coordinated Sybil attacks with sub-5ms execution.
                </p>
              </div>

              <!-- Industry Work Experience Card -->
              <div class="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2.5">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <h5 class="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      NeuralBI Ltd — AI & Full-Stack Engineering Intern
                    </h5>
                  </div>
                  <span class="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    Jun 2025 – Aug 2025
                  </span>
                </div>
                <ul class="text-[11px] text-zinc-300 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Built real-time telemetry dashboards tracking request volumes and error distributions across microservices processing <strong>10,000+ daily events</strong>.</li>
                  <li>Optimized asynchronous Python & Node.js service layers, reducing API query latency by <strong>~35%</strong>.</li>
                  <li>Authored SRS and security API design specifications for 12+ RESTful endpoints under strict AppSec constraints.</li>
                </ul>
              </div>

              <!-- Verified Projects Portfolio -->
              <div>
                <h5 class="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider mb-3">
                  Verified Engineering Portfolio
                </h5>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  
                  <div class="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                    <div class="font-bold text-white font-mono flex items-center justify-between">
                      <span>🛡️ AetherVault</span>
                      <span class="text-[9px] text-zinc-500 font-normal">AES-256 Secrets</span>
                    </div>
                    <p class="text-[11px] text-zinc-400 leading-relaxed">
                      Zero-trust secrets manager with AES-256 encryption at rest, scoped RBAC (dev/staging/prod), and automated Snyk vulnerability auditing.
                    </p>
                  </div>

                  <div class="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                    <div class="font-bold text-white font-mono flex items-center justify-between">
                      <span>⚡ Kerno CRM</span>
                      <span class="text-[9px] text-zinc-500 font-normal">Kubernetes SaaS</span>
                    </div>
                    <p class="text-[11px] text-zinc-400 leading-relaxed">
                      Multi-tenant SaaS CRM on Kubernetes with tenant-scoped RLS across 12 tables, payment anomaly detection, and Razorpay webhooks.
                    </p>
                  </div>

                  <div class="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                    <div class="font-bold text-white font-mono flex items-center justify-between">
                      <span>🧠 VigilAI Sentinel</span>
                      <span class="text-[9px] text-zinc-500 font-normal">Sybil Ring Defense</span>
                    </div>
                    <p class="text-[11px] text-zinc-400 leading-relaxed">
                      Heterogeneous entity graphs, 33 zero-leakage point-in-time features, HistGradientBoosting (Model F &tau;*=0.90), sub-5ms latency.
                    </p>
                  </div>

                  <div class="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                    <div class="font-bold text-white font-mono flex items-center justify-between">
                      <span>📊 GitInsights</span>
                      <span class="text-[9px] text-zinc-500 font-normal">PostgreSQL Engine</span>
                    </div>
                    <p class="text-[11px] text-zinc-400 leading-relaxed">
                      Security-conscious analytics platform with session controls; ~30% query response time improvement via index tuning.
                    </p>
                  </div>

                </div>
              </div>

              <!-- Certifications & Awards -->
              <div class="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                <div class="space-y-0.5 text-center sm:text-left">
                  <div class="text-zinc-200 font-bold">🏆 Honors & Certifications</div>
                  <div class="text-[11px] text-zinc-400">
                    Finalist NASSCOM NextGen Nexus · Top 5 SIH Hackathon · NVIDIA Certified (Deep Learning & NLP)
                  </div>
                </div>
                <a
                  href="https://github.com/Eshwar187/abuse-ring-sentinel"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors shrink-0 cursor-pointer"
                >
                  View GitHub Source →
                </a>
              </div>

            </div>

          </div>

        </div>
      </section>

      <!-- CALL TO ACTION BANNER -->
      <section class="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center z-10">
        <div class="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div class="max-w-2xl mx-auto space-y-4">
            <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Protect Your Checkout?
            </h2>
            <p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Integrate in minutes with drop-in SDKs, live graph visualization, and automated webhook mitigation.
            </p>
            <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                routerLink="/signup"
                class="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                Create Merchant Account
              </a>
              <a
                routerLink="/demo"
                class="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-all cursor-pointer"
              >
                Launch 6.9k Benchmark
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- ENTERPRISE FOOTER -->
      <footer class="mt-auto border-t border-white/[0.06] bg-[#07080B] pt-12 pb-8 px-4 sm:px-6 lg:px-8 text-xs text-zinc-400 z-10">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-zinc-800/80">
          
          <!-- Col 1: Brand & Status -->
          <div class="lg:col-span-2 space-y-3">
            <div class="flex items-center gap-2.5">
              <img src="vigilai_logo.jpg" alt="VigilAI Logo" class="w-7 h-7 rounded-lg object-cover border border-white/10" />
              <span class="text-sm font-bold text-white tracking-tight">VigilAI <span class="text-[10px] font-mono text-zinc-500">Enterprise</span></span>
            </div>
            <p class="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Autonomous AI Cybersecurity and Heterogeneous Entity Collusion Defense. Built with zero point-in-time data leakage and sub-5ms decision latency.
            </p>
            <div class="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Operational (FastAPI + Model F)</span>
            </div>
          </div>

          <!-- Col 2: Platform -->
          <div class="space-y-2.5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-white font-mono">Platform</h4>
            <ul class="space-y-1.5 text-xs">
              <li><a href="#how-it-works" class="hover:text-white transition-colors">Graph Engine</a></li>
              <li><a routerLink="/demo" class="hover:text-white transition-colors">6.9k Benchmark Demo</a></li>
              <li><a href="#sdk" class="hover:text-white transition-colors">Developer SDK</a></li>
              <li><a routerLink="/login" class="hover:text-white transition-colors">Merchant Console</a></li>
              <li><a href="#developer" class="hover:text-white transition-colors">Meet the Developer</a></li>
            </ul>
          </div>

          <!-- Col 3: Architecture -->
          <div class="space-y-2.5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-white font-mono">Architecture</h4>
            <ul class="space-y-1.5 text-xs">
              <li><span class="text-zinc-400">Model F (&tau;* = 0.90)</span></li>
              <li><span class="text-zinc-400">Bipartite Entity Graphs</span></li>
              <li><span class="text-zinc-400">TLS 1.3 Transport</span></li>
              <li><span class="text-zinc-400">Strict Tenant Partitioning</span></li>
              <li><span class="text-zinc-400">Zero-Leakage Causality</span></li>
            </ul>
          </div>

          <!-- Col 4: Legal & Compliance -->
          <div class="space-y-2.5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-white font-mono">Compliance & Trust</h4>
            <ul class="space-y-1.5 text-xs">
              <li><a routerLink="/terms" class="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a routerLink="/privacy" class="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a routerLink="/terms" class="hover:text-white transition-colors">Acceptable Use Policy</a></li>
              <li><a routerLink="/privacy" class="hover:text-white transition-colors">GDPR & DPDP Compliance</a></li>
              <li><a href="mailto:jeshwar.work@gmail.com" class="hover:text-white transition-colors">Security Disclosures</a></li>
            </ul>
          </div>

        </div>

        <div class="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-mono">
          <div>
            &copy; 2026 VigilAI Inc. All rights reserved. Created & Architected by <strong class="text-zinc-300 font-semibold">Eshwar J</strong>.
          </div>
          <div class="flex items-center gap-6">
            <a routerLink="/terms" class="hover:text-zinc-300 transition-colors">Terms</a>
            <a routerLink="/privacy" class="hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="mailto:jeshwar.work@gmail.com" class="hover:text-zinc-300 transition-colors">Support</a>
            <a href="https://github.com/Eshwar187/abuse-ring-sentinel" target="_blank" class="hover:text-zinc-300 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

    </div>
  `,
})
export class LandingPageComponent {
  readonly activeSdkTab = signal<'node' | 'python' | 'curl'>('node');
  readonly copiedCli = signal<boolean>(false);
  readonly copiedSdk = signal<boolean>(false);

  readonly activeScenario = signal<'sybil' | 'card_test' | 'ato' | 'legit'>('sybil');

  readonly scenarios: AttackScenario[] = [
    {
      id: 'sybil',
      name: 'Sybil Promo Farm',
      badge: 'PROMO_RING_ATTACK',
      description: 'Distributed syndicate registering 14 distinct emails to harvest high-discount new-user signup vouchers from single hardware device.',
      user: 'usr_sybil_ring_09',
      amount: '₹499.00 (PROMO50)',
      device: 'dev_fp_99a8x2',
      ip: '198.51.100.42 (Residential Proxy)',
      entitiesShared: '14 connected accounts',
      velocity: '28 orders / 10min',
      collusionIndex: '0.964 (High Density)',
      riskScore: 0.9842,
      decision: 'BLOCK',
      action: 'AUTO_REJECT_VOUCHER & BLACKLIST_DEVICE',
      reasons: ['DEVICE_SHARED_USER_CARDINALITY_HIGH', 'PROMO_VELOCITY_ANOMALY', 'BIPARTITE_COLLUSION_CLUSTER'],
    },
    {
      id: 'card_test',
      name: 'Card Testing Botnet',
      badge: 'CARD_TESTING_BOT',
      description: 'Automated script rapidly testing stolen PANs with micro-charges ($1.00 - $3.00) across 8 rotating subnets.',
      user: 'usr_cardbot_771',
      amount: '₹85.00 ($1.00 Test)',
      device: 'dev_bot_headless_chrome',
      ip: '203.0.113.88 (Hosting ASN)',
      entitiesShared: '8 rotating cards',
      velocity: '54 req / 1min',
      collusionIndex: '0.988 (Botnet Burst)',
      riskScore: 0.9950,
      decision: 'BLOCK',
      action: 'SILENT_PAYMENT_GATEWAY_DROP',
      reasons: ['VELOCITY_BURST_1MIN', 'CARD_TESTING_MICRO_AMOUNT', 'DATACENTER_IP_DETECTED'],
    },
    {
      id: 'ato',
      name: 'Account Takeover',
      badge: 'CREDENTIAL_STUFFING',
      description: 'Dormant user account suddenly active from new foreign IP and unrecognized device with high-value cart.',
      user: 'usr_dormant_vip_12',
      amount: '₹48,990.00 (Electronics)',
      device: 'dev_unknown_mobile_01',
      ip: '185.220.101.5 (Tor Exit Node)',
      entitiesShared: '1 prior user',
      velocity: '1 order / 180 days',
      collusionIndex: '0.412 (Tenure Anomaly)',
      riskScore: 0.7620,
      decision: 'REVIEW',
      action: 'TRIGGER_STEP_UP_MFA_CHALLENGE',
      reasons: ['DEVICE_FIRST_SEEN', 'AMOUNT_TO_USER_MEAN_RATIO_SPIKE', 'TOR_EXIT_NODE'],
    },
    {
      id: 'legit',
      name: 'Legitimate VIP Buyer',
      badge: 'ESTABLISHED_CUSTOMER',
      description: 'Repeat organic customer with 400+ days tenure, matching billing/shipping addresses, and stable transaction history.',
      user: 'usr_verified_eshwar',
      amount: '₹2,499.00',
      device: 'dev_macbook_pro_m3',
      ip: '49.207.198.11 (Airtel Broadband)',
      entitiesShared: '0 other users (Clean)',
      velocity: '1 order / 14 days',
      collusionIndex: '0.012 (Isolated Clean Node)',
      riskScore: 0.0124,
      decision: 'APPROVE',
      action: 'INSTANT_PAYMENT_CLEARANCE',
      reasons: ['ESTABLISHED_ACCOUNT_TENURE', 'BILLING_SHIPPING_ADDRESS_MATCH', 'ORGANIC_BEHAVIORAL_BASE'],
    },
  ];

  readonly currentScenario = computed(() => {
    return this.scenarios.find(s => s.id === this.activeScenario()) || this.scenarios[0];
  });

  selectScenario(id: 'sybil' | 'card_test' | 'ato' | 'legit'): void {
    this.activeScenario.set(id);
  }

  getVerdictCardClass(): string {
    const d = this.currentScenario().decision;
    if (d === 'BLOCK') return 'bg-rose-950/30 border-rose-500/30';
    if (d === 'APPROVE') return 'bg-emerald-950/30 border-emerald-500/30';
    return 'bg-amber-950/30 border-amber-500/30';
  }

  getVerdictBadgeClass(): string {
    const d = this.currentScenario().decision;
    if (d === 'BLOCK') return 'bg-rose-500/20 text-rose-300';
    if (d === 'APPROVE') return 'bg-emerald-500/20 text-emerald-300';
    return 'bg-amber-500/20 text-amber-300';
  }

  getScoreColorClass(): string {
    const d = this.currentScenario().decision;
    if (d === 'BLOCK') return 'text-rose-400';
    if (d === 'APPROVE') return 'text-emerald-400';
    return 'text-amber-400';
  }

  copyGitCloneCommand(): void {
    navigator.clipboard?.writeText('git clone https://github.com/Eshwar187/abuse-ring-sentinel.git');
    this.copiedCli.set(true);
    setTimeout(() => this.copiedCli.set(false), 2000);
  }

  copyCodeSnippet(): void {
    const tab = this.activeSdkTab();
    let text = '';
    if (tab === 'node') {
      text = `import axios from 'axios';\n\nconst response = await axios.post('https://vigil-ai-f0ev.onrender.com/api/v1/risk/evaluate', {\n  transaction_id: 'tx_order_88192',\n  user_id: 'usr_buyer_4401',\n  amount: 499.00,\n  currency: 'INR',\n  timestamp: new Date().toISOString(),\n  device_id: 'dev_fp_x99a',\n  ip_address: '198.51.100.22',\n  payment_method_id: 'pm_tok_99182',\n  promo_code: 'WELCOME50'\n}, {\n  headers: { 'X-API-Key': 'YOUR_API_KEY' }\n});`;
    } else if (tab === 'python') {
      text = `import requests\nfrom datetime import datetime, timezone\n\npayload = {\n    "transaction_id": "tx_order_88192",\n    "user_id": "usr_buyer_4401",\n    "amount": 499.00,\n    "currency": "INR",\n    "timestamp": datetime.now(timezone.utc).isoformat(),\n    "device_id": "dev_fp_x99a",\n    "ip_address": "198.51.100.22",\n    "payment_method_id": "pm_tok_99182",\n    "promo_code": "WELCOME50"\n}\n\nheaders = {"X-API-Key": "YOUR_API_KEY"}\nresp = requests.post("https://vigil-ai-f0ev.onrender.com/api/v1/risk/evaluate", json=payload, headers=headers)`;
    } else {
      text = `curl -X POST "https://vigil-ai-f0ev.onrender.com/api/v1/risk/evaluate" \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -d '{"transaction_id":"tx_order_88192","user_id":"usr_buyer_4401","amount":499.00,"currency":"INR"}'`;
    }
    navigator.clipboard?.writeText(text);
    this.copiedSdk.set(true);
    setTimeout(() => this.copiedSdk.set(false), 2000);
  }
}
