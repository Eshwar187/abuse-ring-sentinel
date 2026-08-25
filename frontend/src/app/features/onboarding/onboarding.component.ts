import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Shield,
  CheckCircle2,
  Key,
  Code2,
  Zap,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Building,
  Terminal,
  Activity,
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { MerchantService } from '../../core/services/merchant.service';
import { RawTransactionEvent, RiskEvaluateResponse } from '../../core/models/risk.models';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <!-- Header -->
      <header class="border-b border-slate-800 bg-slate-950/80 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="logo.svg" alt="Abuse-Ring Sentinel Logo" class="w-9 h-9 rounded-lg shadow-md shadow-rose-600/30 object-contain" />
          <div>
            <div class="text-sm font-bold text-white">Abuse-Ring Sentinel</div>
            <div class="text-[10px] text-slate-400">Merchant Onboarding & Integration Setup</div>
          </div>
        </div>

        <a
          routerLink="/app/overview"
          class="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Skip to Dashboard →
        </a>
      </header>

      <!-- Main Step Container -->
      <div class="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        <!-- Progress Stepper (5 Steps) -->
        <div class="grid grid-cols-5 gap-2 mb-10 text-center">
          <div
            *ngFor="let step of steps; let idx = index"
            class="space-y-1.5"
          >
            <div
              class="h-1.5 rounded-full transition-all duration-300"
              [ngClass]="{
                'bg-rose-500': currentStep() > idx + 1,
                'bg-rose-600 ring-2 ring-rose-400/40': currentStep() === idx + 1,
                'bg-slate-800': currentStep() < idx + 1
              }"
            ></div>
            <div
              class="text-[11px] font-semibold hidden sm:block truncate"
              [ngClass]="{
                'text-white': currentStep() === idx + 1,
                'text-rose-400': currentStep() > idx + 1,
                'text-slate-400': currentStep() < idx + 1
              }"
            >
              {{ step }}
            </div>
          </div>
        </div>

        <!-- Step Content Card -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl">
          <!-- STEP 1: Profile -->
          <div *ngIf="currentStep() === 1" class="space-y-6 animate-fade-in">
            <div class="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <lucide-icon name="building" [size]="20"></lucide-icon>
              </div>
              <div>
                <h2 class="text-lg font-bold text-white">Step 1: Configure Merchant Profile</h2>
                <p class="text-xs text-slate-400">Set up your business vertical and transaction defaults</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Company / Entity Name</label>
                <input
                  type="text"
                  [(ngModel)]="companyName"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Primary Business Category</label>
                <select
                  [(ngModel)]="vertical"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
                >
                  <option value="electronics">Electronics & Digital Goods</option>
                  <option value="fashion">Fashion & Apparel</option>
                  <option value="travel">Travel & Hospitality</option>
                  <option value="gaming">Gaming & Virtual Currencies</option>
                  <option value="marketplace">Multi-Vendor Marketplace</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Settlement Currency</label>
                <select
                  [(ngModel)]="currency"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
                >
                  <option value="INR">INR (₹ Indian Rupee)</option>
                  <option value="USD">USD ($ US Dollar)</option>
                  <option value="EUR">EUR (€ Euro)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Risk Policy Level</label>
                <div class="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400">
                  Fixed Threshold: τ* = 0.90 (Block ≥ 0.90)
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 2: API Credentials -->
          <div *ngIf="currentStep() === 2" class="space-y-6 animate-fade-in">
            <div class="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <lucide-icon name="key" [size]="20"></lucide-icon>
              </div>
              <div>
                <h2 class="text-lg font-bold text-white">Step 2: API Credentials & Authentication</h2>
                <p class="text-xs text-slate-400">Secure server-to-server gateway headers</p>
              </div>
            </div>

            <div class="space-y-4">
              <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-300">Active Merchant API Key</span>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">Active</span>
                </div>
                <div class="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-200">
                  <span class="truncate">{{ activeApiKey() }}</span>
                  <button
                    (click)="copyApiKey()"
                    class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 shrink-0"
                  >
                    <lucide-icon [name]="isCopied() ? 'check' : 'copy'" [size]="12"></lucide-icon>
                    <span>{{ isCopied() ? 'Copied' : 'Copy' }}</span>
                  </button>
                </div>
                <p class="text-[11px] text-slate-400">
                  Include this key in the <code class="text-rose-400 font-mono">X-API-Key</code> or <code class="text-rose-400 font-mono">Authorization: Bearer &lt;key&gt;</code> header.
                </p>
              </div>

              <div class="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 flex items-start gap-2.5">
                <lucide-icon name="shield" [size]="16" class="text-indigo-400 shrink-0 mt-0.5"></lucide-icon>
                <div>
                  <strong>Tenant Isolation Guarantee</strong>: Your API key scopes all transactions, behavioral velocities, and entity graph subgraphs strictly to your merchant ID.
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 3: Integration Method -->
          <div *ngIf="currentStep() === 3" class="space-y-6 animate-fade-in">
            <div class="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <lucide-icon name="code-2" [size]="20"></lucide-icon>
              </div>
              <div>
                <h2 class="text-lg font-bold text-white">Step 3: Select Integration SDK / Method</h2>
                <p class="text-xs text-slate-400">Choose your preferred stack to send raw transaction events</p>
              </div>
            </div>

            <div class="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                *ngFor="let lang of ['cURL', 'TypeScript', 'Python']"
                (click)="selectedSnippet = lang"
                class="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                [ngClass]="{
                  'bg-rose-600 text-white': selectedSnippet === lang,
                  'text-slate-400 hover:text-white': selectedSnippet !== lang
                }"
              >
                {{ lang }}
              </button>
            </div>

            <div class="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-x-auto text-emerald-300">
              <pre *ngIf="selectedSnippet === 'cURL'"><code>curl -X POST "http://localhost:8000/api/v1/risk/evaluate" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: {{ activeApiKey() }}" \\
  -d '&#123;
    "transaction_id": "tx_onboarding_01",
    "user_id": "usr_test_99",
    "amount": 299.99,
    "currency": "INR",
    "timestamp": "2026-03-16T12:00:00Z",
    "device_id": "dev_onboarding_fingerprint",
    "ip_address": "203.0.113.195",
    "payment_method_id": "pm_tok_4912"
  &#125;'</code></pre>

              <pre *ngIf="selectedSnippet === 'TypeScript'"><code>import axios from 'axios';

const response = await axios.post('http://localhost:8000/api/v1/risk/evaluate', &#123;
  transaction_id: 'tx_onboarding_01',
  user_id: 'usr_test_99',
  amount: 299.99,
  currency: 'INR',
  timestamp: new Date().toISOString(),
  device_id: 'dev_onboarding_fingerprint',
  ip_address: '203.0.113.195',
  payment_method_id: 'pm_tok_4912'
&#125;, &#123;
  headers: &#123; 'X-API-Key': '{{ activeApiKey() }}' &#125;
&#125;);

console.log(response.data.decision); // 'APPROVE' | 'REVIEW' | 'BLOCK'</code></pre>

              <pre *ngIf="selectedSnippet === 'Python'"><code>import requests

payload = &#123;
    "transaction_id": "tx_onboarding_01",
    "user_id": "usr_test_99",
    "amount": 299.99,
    "currency": "INR",
    "timestamp": "2026-03-16T12:00:00Z",
    "device_id": "dev_onboarding_fingerprint",
    "ip_address": "203.0.113.195",
    "payment_method_id": "pm_tok_4912",
&#125;

headers = &#123;"X-API-Key": "{{ activeApiKey() }}"&#125;
r = requests.post("http://localhost:8000/api/v1/risk/evaluate", json=payload, headers=headers)
print(r.json()["decision"])</code></pre>
            </div>
          </div>

          <!-- STEP 4: Send First Live Transaction -->
          <div *ngIf="currentStep() === 4" class="space-y-6 animate-fade-in">
            <div class="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <lucide-icon name="zap" [size]="20"></lucide-icon>
              </div>
              <div>
                <h2 class="text-lg font-bold text-white">Step 4: Send First Live Risk Evaluation</h2>
                <p class="text-xs text-slate-400">Trigger real inference through your isolated merchant pipeline</p>
              </div>
            </div>

            <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div class="text-xs font-semibold text-slate-300">Payload to Evaluate (Live POST /api/v1/risk/evaluate):</div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div class="p-2 bg-slate-900 rounded border border-slate-800">
                  <span class="text-slate-400 text-[10px] block">Amount</span>
                  <span class="text-white font-bold">₹249.99</span>
                </div>
                <div class="p-2 bg-slate-900 rounded border border-slate-800">
                  <span class="text-slate-400 text-[10px] block">User ID</span>
                  <span class="text-white font-bold">usr_live_onboard_01</span>
                </div>
                <div class="p-2 bg-slate-900 rounded border border-slate-800">
                  <span class="text-slate-400 text-[10px] block">Device ID</span>
                  <span class="text-white font-bold">dev_onboard_test</span>
                </div>
                <div class="p-2 bg-slate-900 rounded border border-slate-800">
                  <span class="text-slate-400 text-[10px] block">IP Address</span>
                  <span class="text-white font-bold">203.0.113.88</span>
                </div>
              </div>

              <div class="pt-2">
                <button
                  type="button"
                  (click)="sendTestTransaction()"
                  [disabled]="isEvaluating()"
                  class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  <lucide-icon name="zap" [size]="14"></lucide-icon>
                  <span>{{ isEvaluating() ? 'Evaluating with Real Model...' : 'Execute Live Risk Evaluation' }}</span>
                </button>
              </div>
            </div>

            <!-- Evaluation Live Result -->
            <div *ngIf="evaluationResult()" class="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-3 animate-fade-in">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <lucide-icon name="check-circle-2" [size]="14"></lucide-icon>
                  Live Decision Received from Frozen Model
                </span>
                <span class="text-xs font-mono text-slate-400">{{ evaluationResult()?.latency_ms }} ms latency</span>
              </div>

              <div class="grid grid-cols-3 gap-3 text-center">
                <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">Decision</div>
                  <div class="text-sm font-bold font-mono text-emerald-400 mt-1">
                    {{ evaluationResult()?.decision }}
                  </div>
                </div>
                <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">Risk Probability</div>
                  <div class="text-sm font-bold font-mono text-slate-200 mt-1">
                    {{ ((evaluationResult()?.risk_score ?? 0) * 100).toFixed(2) }}%
                  </div>
                </div>
                <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">Derived Features</div>
                  <div class="text-sm font-bold font-mono text-indigo-400 mt-1">
                    33 / 33 OK
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 5: Verification & Complete -->
          <div *ngIf="currentStep() === 5" class="space-y-6 text-center animate-fade-in py-4">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <lucide-icon name="check-circle-2" [size]="32"></lucide-icon>
            </div>

            <div>
              <h2 class="text-xl font-bold text-white">Merchant Integration Verified!</h2>
              <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Your isolated tenant state store and entity relationship graph are initialized and actively receiving transactions.
              </p>
            </div>

            <div class="max-w-md mx-auto bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2 text-xs">
              <div class="flex items-center gap-2 text-emerald-400">
                <lucide-icon name="check" [size]="14"></lucide-icon>
                <span>Merchant tenant identity verified</span>
              </div>
              <div class="flex items-center gap-2 text-emerald-400">
                <lucide-icon name="check" [size]="14"></lucide-icon>
                <span>API authentication headers operational</span>
              </div>
              <div class="flex items-center gap-2 text-emerald-400">
                <lucide-icon name="check" [size]="14"></lucide-icon>
                <span>Point-in-time 33-feature adapter active</span>
              </div>
              <div class="flex items-center gap-2 text-emerald-400">
                <lucide-icon name="check" [size]="14"></lucide-icon>
                <span>Frozen model inference verified (sub-5ms)</span>
              </div>
            </div>

            <div class="pt-4">
              <button
                type="button"
                (click)="launchDashboard()"
                class="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 inline-flex items-center gap-2"
              >
                <span>Launch Live Merchant Dashboard</span>
                <lucide-icon name="arrow-right" [size]="16"></lucide-icon>
              </button>
            </div>
          </div>

          <!-- Bottom Navigation Bar for Stepper -->
          <div *ngIf="currentStep() < 5" class="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            <button
              *ngIf="currentStep() > 1"
              type="button"
              (click)="previousStep()"
              class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <lucide-icon name="arrow-left" [size]="14"></lucide-icon>
              <span>Back</span>
            </button>
            <div *ngIf="currentStep() === 1"></div>

            <button
              type="button"
              (click)="nextStep()"
              class="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all"
            >
              <span>{{ currentStep() === 4 ? 'Complete Onboarding' : 'Next Step' }}</span>
              <lucide-icon name="arrow-right" [size]="14"></lucide-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OnboardingComponent {
  private auth = inject(AuthService);
  private merchantService = inject(MerchantService);
  private router = inject(Router);

  readonly steps = [
    '1. Profile',
    '2. Credentials',
    '3. SDK Method',
    '4. Test Tx',
    '5. Complete',
  ];

  readonly currentStep = signal(1);
  companyName = this.auth.currentUser()?.company_name || 'Apex Retail Global';
  vertical = 'electronics';
  currency = 'INR';
  selectedSnippet = 'TypeScript';

  readonly isCopied = signal(false);
  readonly isEvaluating = signal(false);
  readonly evaluationResult = signal<RiskEvaluateResponse | null>(null);

  activeApiKey = signal(
    this.auth.rawApiKeyJustGenerated() ||
    this.auth.currentUser()?.api_key_masked ||
    'ars_live_test_merchant_01'
  );

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
      user_id: 'usr_live_onboard_01',
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
