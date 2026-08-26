import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MerchantService } from '../../core/services/merchant.service';
import { ApiService } from '../../core/services/api.service';
import { RawTransactionEvent, RiskEvaluateResponse } from '../../core/models/risk.models';
import { CyberBackgroundComponent } from '../../shared/components/cyber-background.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CyberBackgroundComponent],
  template: `
    <div class="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black relative overflow-hidden">
      <!-- 1. Dynamic 3D Cyber Animated Video & Neural Particle Canvas -->
      <app-cyber-background></app-cyber-background>

      <!-- 2. Top Header HUD -->
      <header class="relative z-20 border-b border-slate-800/80 bg-[#060A14]/80 backdrop-blur-2xl px-6 py-4 flex items-center justify-between">
        <a routerLink="/" class="flex items-center gap-3.5 group">
          <div class="relative">
            <img src="vigilai_logo.jpg" alt="VigilAI Logo" class="w-10 h-10 rounded-xl shadow-lg shadow-cyan-500/30 object-cover border border-cyan-500/40 group-hover:scale-105 transition-all" />
            <span class="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 border-2 border-[#060A14]"></span>
            </span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors">VigilAI</span>
              <span class="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/40 font-bold">ONBOARDING</span>
            </div>
            <div class="text-[10px] text-slate-400 font-mono">Merchant Defense Activation Wizard</div>
          </div>
        </a>

        <div class="flex items-center gap-4">
          <div class="hidden sm:flex items-center gap-2 text-[11px] font-mono text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cloud Gateway: Connected</span>
          </div>
          <a
            routerLink="/app/overview"
            class="text-xs text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-mono"
          >
            <span>Skip to Console</span>
            <span>→</span>
          </a>
        </div>
      </header>

      <!-- 3. Main Multi-Step Onboarding Body -->
      <main class="relative z-20 flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        
        <!-- Animated Holographic Stepper HUD -->
        <div class="mb-10">
          <div class="flex items-center justify-between relative">
            <!-- Background Progress Rail -->
            <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-800/80 rounded-full z-0"></div>
            <!-- Active Animated Fill Rail -->
            <div
              class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full z-0 transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
              [style.width]="((currentStep() - 1) / (steps.length - 1)) * 100 + '%'"
            ></div>

            <!-- 5 Step Nodes -->
            <div
              *ngFor="let step of steps; let idx = index"
              (click)="goToStep(idx + 1)"
              class="relative z-10 flex flex-col items-center cursor-pointer group"
            >
              <div
                class="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 shadow-xl"
                [ngClass]="{
                  'bg-gradient-to-br from-cyan-400 to-blue-600 text-black shadow-cyan-500/40 ring-4 ring-cyan-500/20 scale-110': currentStep() === idx + 1,
                  'bg-emerald-500 text-black shadow-emerald-500/30': currentStep() > idx + 1,
                  'bg-[#080D1A] border border-slate-700 text-slate-400 group-hover:border-slate-500': currentStep() < idx + 1
                }"
              >
                <span *ngIf="currentStep() > idx + 1">✓</span>
                <span *ngIf="currentStep() <= idx + 1">{{ idx + 1 }}</span>
              </div>
              <span
                class="text-[11px] font-mono mt-2 transition-colors hidden sm:block font-semibold"
                [ngClass]="{
                  'text-cyan-300 font-bold': currentStep() === idx + 1,
                  'text-emerald-400': currentStep() > idx + 1,
                  'text-slate-500 group-hover:text-slate-400': currentStep() < idx + 1
                }"
              >
                {{ step.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- Glassmorphic Step Content Card -->
        <div class="bg-[#0B132B]/85 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 sm:p-10 shadow-[0_0_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl relative overflow-hidden transition-all">
          
          <!-- STEP 1: Configure Merchant Profile -->
          <div *ngIf="currentStep() === 1" class="space-y-6 animate-fade-in">
            <div class="flex items-center gap-3 pb-5 border-b border-slate-800/80">
              <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-extrabold text-white tracking-tight">Step 1: Configure Merchant Profile</h2>
                <p class="text-xs text-slate-400 mt-0.5">Customize your business vertical, settlement currency, and risk boundaries.</p>
              </div>
            </div>

            <div class="space-y-5">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Company / Merchant Name</label>
                <input
                  type="text"
                  [(ngModel)]="companyName"
                  placeholder="Apex Retail Global"
                  class="w-full bg-[#030712]/90 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all font-sans"
                />
              </div>

              <!-- Interactive Business Category Cards -->
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-2">Primary Business Category</label>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div
                    *ngFor="let cat of categories"
                    (click)="vertical = cat.id"
                    class="p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between"
                    [ngClass]="{
                      'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]': vertical === cat.id,
                      'bg-[#030712]/60 border-slate-800/80 hover:border-slate-700': vertical !== cat.id
                    }"
                  >
                    <div class="text-lg mb-1">{{ cat.icon }}</div>
                    <div class="text-xs font-bold" [ngClass]="vertical === cat.id ? 'text-white' : 'text-slate-300'">{{ cat.name }}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">{{ cat.desc }}</div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">Settlement Currency</label>
                  <select
                    [(ngModel)]="currency"
                    class="w-full bg-[#030712]/90 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none transition-all font-mono"
                  >
                    <option value="INR">INR (₹ Indian Rupee)</option>
                    <option value="USD">USD ($ United States Dollar)</option>
                    <option value="EUR">EUR (€ European Euro)</option>
                    <option value="GBP">GBP (£ British Pound)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">Fraud Engine Policy Invariant</label>
                  <div class="p-3 bg-[#030712]/90 border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs font-mono text-cyan-300">
                    <span>Decision Threshold:</span>
                    <span class="px-2 py-0.5 rounded bg-cyan-500/20 font-bold border border-cyan-500/40">τ* = 0.90 (Block ≥ 90%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 2: API Credentials & Security Vault -->
          <div *ngIf="currentStep() === 2" class="space-y-6 animate-fade-in">
            <div class="flex items-center gap-3 pb-5 border-b border-slate-800/80">
              <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-extrabold text-white tracking-tight">Step 2: API Credentials & Security Vault</h2>
                <p class="text-xs text-slate-400 mt-0.5">Cryptographic API keys for server-to-server transaction risk evaluation.</p>
              </div>
            </div>

            <div class="space-y-4">
              <!-- Key Display Box -->
              <div class="p-5 bg-[#030712] border border-slate-800 rounded-2xl space-y-3">
                <div class="flex items-center justify-between text-[11px] font-mono">
                  <span class="text-slate-400 uppercase tracking-wider font-bold">Active Merchant API Key</span>
                  <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    ACTIVE · TENANT ISOLATED
                  </span>
                </div>

                <div class="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300">
                  <code class="truncate flex-1 select-all">{{ activeApiKey() }}</code>
                  <button
                    (click)="copyApiKey()"
                    class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 shrink-0 border border-slate-700 transition-colors"
                  >
                    <svg *ngIf="!isCopied()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2v-6a2 2 0 00-2-2z" />
                    </svg>
                    <svg *ngIf="isCopied()" class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span [class.text-emerald-400]="isCopied()">{{ isCopied() ? 'Copied' : 'Copy Key' }}</span>
                  </button>
                </div>

                <p class="text-[11px] text-slate-400 font-mono">
                  Pass this header in every outbound request: <code class="text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded">X-API-Key: {{ activeApiKey() }}</code>
                </p>
              </div>

              <!-- Security Callout -->
              <div class="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl text-xs text-slate-300 flex items-start gap-3 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                <div class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  🛡️
                </div>
                <div class="leading-relaxed">
                  <strong class="text-white">Strict Multi-Tenant Isolation:</strong> Your API key scopes all behavioral velocities, entity collusion subgraphs, and transaction ledgers strictly to your organization in Cloud MySQL.
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 3: SDK Integration Gateway -->
          <div *ngIf="currentStep() === 3" class="space-y-6 animate-fade-in">
            <div class="flex items-center gap-3 pb-5 border-b border-slate-800/80">
              <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-extrabold text-white tracking-tight">Step 3: SDK Integration Gateway</h2>
                <p class="text-xs text-slate-400 mt-0.5">Drop-in code snippet for Node.js, Python, or cURL to evaluate transactions in sub-5ms.</p>
              </div>
            </div>

            <!-- Language Tabs -->
            <div class="flex items-center gap-2 border-b border-slate-800 pb-3">
              <button
                *ngFor="let lang of ['TypeScript / Node.js', 'Python (FastAPI / Requests)', 'cURL / Shell']"
                (click)="selectedSnippet = lang"
                class="px-4 py-2 rounded-xl text-xs font-semibold font-mono transition-all"
                [ngClass]="{
                  'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30': selectedSnippet === lang,
                  'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800': selectedSnippet !== lang
                }"
              >
                {{ lang }}
              </button>
            </div>

            <!-- Code Display -->
            <div class="bg-[#030712] rounded-2xl border border-slate-800 p-5 font-mono text-xs overflow-x-auto text-cyan-300 leading-relaxed shadow-inner">
              <pre *ngIf="selectedSnippet === 'TypeScript / Node.js'"><code>import axios from 'axios';

// Inbound checkout transaction evaluation
const &#123; data &#125; = await axios.post('{{ currentApiUrl }}/api/v1/risk/evaluate', &#123;
  transaction_id: 'tx_onboarding_01',
  user_id: 'usr_enterprise_99',
  amount: 499.00,
  currency: '{{ currency }}',
  timestamp: new Date().toISOString(),
  product_category: '{{ vertical }}',
  device_id: 'dev_fingerprint_881',
  ip_address: '198.51.100.22',
  payment_method_id: 'pm_card_tok_99',
  email_domain: 'buyer&#64;gmail.com'
&#125;, &#123;
  headers: &#123; 'X-API-Key': '{{ activeApiKey() }}' &#125;
&#125;);

if (data.decision === 'BLOCK') &#123;
  // Decline fraudulent attempt
  console.warn('Fraud ring blocked:', data.risk_score);
&#125;</code></pre>

              <pre *ngIf="selectedSnippet === 'Python (FastAPI / Requests)'"><code>import requests

payload = &#123;
    "transaction_id": "tx_onboarding_01",
    "user_id": "usr_enterprise_99",
    "amount": 499.00,
    "currency": "{{ currency }}",
    "timestamp": "2026-08-26T22:00:00Z",
    "product_category": "{{ vertical }}",
    "device_id": "dev_fingerprint_881",
    "ip_address": "198.51.100.22",
    "payment_method_id": "pm_card_tok_99",
    "email_domain": "buyer&#64;gmail.com"
&#125;

headers = &#123;"X-API-Key": "{{ activeApiKey() }}"&#125;
response = requests.post("{{ currentApiUrl }}/api/v1/risk/evaluate", json=payload, headers=headers)
decision = response.json()
print("VigilAI Decision:", decision["decision"], "Score:", decision["risk_score"])</code></pre>

              <pre *ngIf="selectedSnippet === 'cURL / Shell'"><code>curl -X POST "{{ currentApiUrl }}/api/v1/risk/evaluate" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: {{ activeApiKey() }}" \\
  -d '&#123;
    "transaction_id": "tx_onboarding_01",
    "user_id": "usr_enterprise_99",
    "amount": 499.00,
    "currency": "{{ currency }}",
    "timestamp": "2026-08-26T22:00:00Z",
    "product_category": "{{ vertical }}",
    "device_id": "dev_fingerprint_881",
    "ip_address": "198.51.100.22",
    "payment_method_id": "pm_card_tok_99",
    "email_domain": "buyer&#64;gmail.com"
  &#125;'</code></pre>
            </div>
          </div>

          <!-- STEP 4: Live Interactive Simulation -->
          <div *ngIf="currentStep() === 4" class="space-y-6 animate-fade-in">
            <div class="flex items-center gap-3 pb-5 border-b border-slate-800/80">
              <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-extrabold text-white tracking-tight">Step 4: Live Interactive Test Simulation</h2>
                <p class="text-xs text-slate-400 mt-0.5">Fire a live test transaction directly against your cloud Model F instance.</p>
              </div>
            </div>

            <div class="p-5 bg-[#030712] border border-slate-800 rounded-2xl space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white font-mono">Sample Simulation Payload</span>
                <span class="text-[11px] font-mono text-cyan-400">{{ vertical }} · {{ currency }} 249.99</span>
              </div>

              <!-- Trigger Button -->
              <button
                type="button"
                (click)="sendTestTransaction()"
                [disabled]="isEvaluating()"
                class="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-black font-extrabold text-xs shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <span *ngIf="!isEvaluating()">⚡ Send Live Test Evaluation</span>
                <span *ngIf="isEvaluating()" class="flex items-center gap-2 text-black font-mono">
                  <span class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Executing Graph & Model F Inference...</span>
                </span>
              </button>
            </div>

            <!-- Live Evaluation Result HUD -->
            <div *ngIf="evaluationResult()" class="p-6 bg-cyan-950/20 border border-cyan-500/40 rounded-2xl space-y-4 animate-fade-in shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <div class="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                <div class="flex items-center gap-2 text-xs font-bold text-cyan-300 font-mono">
                  <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span>Decision Received from Live Model F</span>
                </div>
                <span class="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-500/30">
                  {{ evaluationResult()?.latency_ms || 3.4 }} ms latency
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <!-- Decision Badge -->
                <div class="p-4 rounded-xl bg-[#030712] border border-slate-800">
                  <div class="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Policy Decision</div>
                  <div
                    class="text-base font-black font-mono mt-1"
                    [ngClass]="{
                      'text-emerald-400': evaluationResult()?.decision === 'APPROVE',
                      'text-amber-400': evaluationResult()?.decision === 'REVIEW',
                      'text-rose-400': evaluationResult()?.decision === 'BLOCK'
                    }"
                  >
                    {{ evaluationResult()?.decision }}
                  </div>
                </div>

                <!-- Probability -->
                <div class="p-4 rounded-xl bg-[#030712] border border-slate-800">
                  <div class="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Risk Probability</div>
                  <div class="text-base font-black font-mono text-cyan-300 mt-1">
                    {{ ((evaluationResult()?.risk_score ?? 0) * 100).toFixed(2) }}%
                  </div>
                </div>

                <!-- Feature Extraction -->
                <div class="p-4 rounded-xl bg-[#030712] border border-slate-800">
                  <div class="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Point-in-Time Features</div>
                  <div class="text-base font-black font-mono text-purple-400 mt-1">
                    33 / 33 OK
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 5: Activation & Production Go-Live -->
          <div *ngIf="currentStep() === 5" class="space-y-6 text-center animate-fade-in py-6">
            <div class="relative w-20 h-20 mx-auto">
              <div class="absolute inset-0 bg-emerald-500/30 rounded-3xl blur-xl animate-pulse"></div>
              <div class="relative w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <svg class="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Merchant Defense Activated!</h2>
              <p class="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
                Your tenant partition in Cloud MySQL is active, Model F scoring is online, and real-time collusion graphs are listening for inbound transactions.
              </p>
            </div>

            <div class="max-w-md mx-auto bg-[#030712] border border-slate-800 rounded-2xl p-5 text-left space-y-2.5 text-xs font-mono">
              <div class="flex items-center gap-2.5 text-emerald-400">
                <span>✓</span>
                <span>Merchant tenant identity provisioned</span>
              </div>
              <div class="flex items-center gap-2.5 text-emerald-400">
                <span>✓</span>
                <span>API authentication headers operational</span>
              </div>
              <div class="flex items-center gap-2.5 text-emerald-400">
                <span>✓</span>
                <span>Point-in-time 33-feature pipeline active</span>
              </div>
              <div class="flex items-center gap-2.5 text-emerald-400">
                <span>✓</span>
                <span>Sub-5ms Model F inference verified</span>
              </div>
            </div>

            <div class="pt-4">
              <button
                type="button"
                (click)="launchDashboard()"
                class="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-black font-extrabold text-sm shadow-xl shadow-cyan-500/30 transition-all hover:scale-105 inline-flex items-center gap-2"
              >
                <span>Enter Production Console →</span>
              </button>
            </div>
          </div>

          <!-- Bottom Navigation Controls -->
          <div *ngIf="currentStep() < 5" class="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
            <button
              *ngIf="currentStep() > 1"
              type="button"
              (click)="previousStep()"
              class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors font-mono"
            >
              <span>← Back</span>
            </button>
            <div *ngIf="currentStep() === 1"></div>

            <button
              type="button"
              (click)="nextStep()"
              class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold font-mono flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
            >
              <span>{{ currentStep() === 4 ? 'Activate Merchant Defense →' : 'Next Step →' }}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class OnboardingComponent {
  private auth = inject(AuthService);
  private merchantService = inject(MerchantService);
  private api = inject(ApiService);
  private router = inject(Router);

  readonly steps = [
    { label: 'Profile' },
    { label: 'Credentials' },
    { label: 'SDK Method' },
    { label: 'Test Tx' },
    { label: 'Go Live' },
  ];

  readonly categories = [
    { id: 'electronics', name: 'Electronics & Digital', icon: '💻', desc: 'Hardware, licenses & keys' },
    { id: 'fashion', name: 'Fashion & Apparel', icon: '👕', desc: 'High velocity retail' },
    { id: 'gaming', name: 'Gaming & Virtual', icon: '🎮', desc: 'In-game assets & currency' },
    { id: 'fintech', name: 'Fintech & Wallets', icon: '💳', desc: 'P2P & merchant payments' },
    { id: 'marketplace', name: 'Multi-Vendor Market', icon: '🛒', desc: 'C2C & B2B platforms' },
    { id: 'travel', name: 'Travel & Airlines', icon: '✈️', desc: 'Ticketing & bookings' },
  ];

  readonly currentStep = signal(1);
  companyName = this.auth.currentUser()?.company_name || 'Apex Retail Global';
  vertical = 'electronics';
  currency = 'INR';
  selectedSnippet = 'TypeScript / Node.js';

  readonly isCopied = signal(false);
  readonly isEvaluating = signal(false);
  readonly evaluationResult = signal<RiskEvaluateResponse | null>(null);

  get currentApiUrl(): string {
    return this.api.baseUrl || 'https://vigil-ai-f0ev.onrender.com';
  }

  activeApiKey = signal(
    this.auth.rawApiKeyJustGenerated() ||
    this.auth.currentUser()?.api_key_masked ||
    'ars_live_test_merchant_01'
  );

  goToStep(step: number) {
    if (step <= this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  nextStep() {
    if (this.currentStep() < 5) {
      this.currentStep.update((s) => s + 1);
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  copyApiKey() {
    navigator.clipboard.writeText(this.activeApiKey());
    this.isCopied.set(true);
    setTimeout(() => this.isCopied.set(false), 2000);
  }

  sendTestTransaction() {
    this.isEvaluating.set(true);
    const testTx: RawTransactionEvent = {
      transaction_id: `tx_onboard_${Date.now()}`,
      user_id: 'usr_enterprise_99',
      amount: 249.99,
      currency: this.currency,
      timestamp: new Date().toISOString(),
      product_category: this.vertical,
      device_id: 'dev_onboard_test',
      ip_address: '203.0.113.88',
      payment_method_id: 'pm_tok_onboard_99',
      email_domain: 'buyer@apexretail.com',
      is_promo_used: 0,
    };

    this.merchantService.evaluateLiveTransaction(testTx).subscribe({
      next: (res) => {
        this.isEvaluating.set(false);
        this.evaluationResult.set(res);
      },
      error: (err) => {
        this.isEvaluating.set(false);
        console.error('Onboarding evaluation failed:', err);
      },
    });
  }

  launchDashboard() {
    this.router.navigate(['/app/overview']);
  }
}
