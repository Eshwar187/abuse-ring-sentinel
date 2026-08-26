import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <!-- Top Navigation Header -->
      <header class="border-b border-slate-800 bg-[#060A14]/90 backdrop-blur-xl sticky top-0 z-50 py-3.5 px-4 sm:px-8 flex items-center justify-between">
        <a routerLink="/" class="flex items-center gap-3">
          <img src="vigilai_logo.jpg" alt="VigilAI Logo" class="w-8 h-8 rounded-xl object-cover border border-cyan-500/40" />
          <span class="text-base font-extrabold text-white">VigilAI <span class="text-xs text-cyan-400 font-mono font-normal">PRIVACY</span></span>
        </a>
        <div class="flex items-center gap-4 text-xs">
          <a routerLink="/terms" class="text-slate-400 hover:text-cyan-300 transition-colors">Terms of Service</a>
          <a routerLink="/" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors">
            ← Return to Home
          </a>
        </div>
      </header>

      <!-- Main Privacy Policy Document Body -->
      <main class="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
        <div class="border-b border-slate-800 pb-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3">
            <span>DATA PROTECTION & PRIVACY COMPLIANCE</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
          <p class="text-xs text-slate-400 mt-2 font-mono">Last Updated: August 26, 2026 | Effective Date: August 26, 2026</p>
        </div>

        <div class="prose prose-invert max-w-none text-slate-300 text-xs leading-relaxed space-y-6">
          <section class="p-6 rounded-2xl bg-[#060A14] border border-slate-800/80 space-y-3">
            <h2 class="text-sm font-bold text-cyan-300 uppercase tracking-wider font-mono">1. Overview & Commitment</h2>
            <p>
              At <strong>VigilAI</strong>, privacy, cryptographic tenant security, and regulatory data compliance are foundational to our autonomous risk evaluation engine. This Privacy Policy details how we collect, process, store, and safeguard transaction metadata and entity graphs submitted through our APIs and merchant consoles.
            </p>
          </section>

          <section class="p-6 rounded-2xl bg-[#060A14] border border-slate-800/80 space-y-3">
            <h2 class="text-sm font-bold text-cyan-300 uppercase tracking-wider font-mono">2. Information We Process</h2>
            <p>To compute real-time fraud probability scores, VigilAI ingests the following transaction signals:</p>
            <ul class="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li><strong>Transaction Telemetry</strong>: Amounts, currencies, timestamps, promotion voucher codes, and merchant product identifiers.</li>
              <li><strong>Device & Network Fingerprints</strong>: Hashed device IDs, browser user-agents, IP addresses, and autonomous system numbers (ASNs).</li>
              <li><strong>Payment & Account Identifiers</strong>: Pseudonymized payment token hashes, truncated account numbers, and masked email domains.</li>
            </ul>
            <p class="text-amber-300/90 text-[11px] font-mono">
              Important: VigilAI does not store raw unhashed credit card numbers (PANs) or CVVs. All sensitive payment metadata must be tokenized by your payment gateway prior to evaluation.
            </p>
          </section>

          <section class="p-6 rounded-2xl bg-[#060A14] border border-slate-800/80 space-y-3">
            <h2 class="text-sm font-bold text-cyan-300 uppercase tracking-wider font-mono">3. Purpose of Processing & Machine Learning</h2>
            <p>We process transaction data solely for legitimate risk prevention purposes:</p>
            <ul class="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li>Real-time scoring via our zero-leakage Scikit-Learn Model F (HistGradientBoosting).</li>
              <li>Heterogeneous entity graph clustering to uncover coordinated Sybil rings and promotion harvesting rings.</li>
              <li>Generating point-in-time velocity signals (e.g., 5-minute velocity spikes, shared device frequencies).</li>
              <li>Providing audit log transparency and false-positive diagnostics for merchant risk officers.</li>
            </ul>
          </section>

          <section class="p-6 rounded-2xl bg-[#060A14] border border-slate-800/80 space-y-3">
            <h2 class="text-sm font-bold text-cyan-300 uppercase tracking-wider font-mono">4. Data Storage, Encryption & Cloud Security</h2>
            <p>
              All persistent transaction records and merchant credentials reside in an enterprise <strong>Aiven Cloud MySQL</strong> database cluster with TLS 1.3 mandatory transport encryption and AES-256 volume encryption at rest. In-memory graph nodes are maintained with strict tenant boundaries.
            </p>
          </section>

          <section class="p-6 rounded-2xl bg-[#060A14] border border-slate-800/80 space-y-3">
            <h2 class="text-sm font-bold text-cyan-300 uppercase tracking-wider font-mono">5. GDPR, CCPA & Global Privacy Rights</h2>
            <p>Under international data protection regulations (including GDPR, CCPA, and the Digital Personal Data Protection Act), merchants and end-users have the right to:</p>
            <ul class="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li><strong>Access & Export</strong>: Request an export of all risk audit records associated with a specific tenant or entity.</li>
              <li><strong>Right to Rectification & Erasure</strong>: Request complete purging of entity graph nodes upon merchant offboarding.</li>
              <li><strong>Automated Decision Review</strong>: Request human review of machine learning automated classification results.</li>
            </ul>
          </section>

          <section class="p-6 rounded-2xl bg-[#060A14] border border-slate-800/80 space-y-3">
            <h2 class="text-sm font-bold text-cyan-300 uppercase tracking-wider font-mono">6. Contact Data Protection Officer</h2>
            <p>
              To exercise privacy rights or submit inquiries regarding our zero-leakage data practices, please reach out to:
            </p>
            <div class="p-3 rounded-xl bg-[#030712] border border-slate-800 font-mono text-cyan-300">
              Email: <a href="mailto:jeshwar.work@gmail.com" class="hover:underline">jeshwar.work&#64;gmail.com</a><br />
              Attn: Data Protection Officer, VigilAI Risk Engine
            </div>
          </section>
        </div>

        <div class="pt-8 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>&copy; 2026 VigilAI Inc. All rights reserved.</span>
          <a routerLink="/terms" class="text-cyan-400 hover:underline">Read Terms of Service →</a>
        </div>
      </main>
    </div>
  `,
})
export class PrivacyComponent {}
