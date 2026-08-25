import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Key,
  Copy,
  Check,
  Zap,
  ShieldAlert,
  Server,
  Code,
  Terminal,
  RefreshCw,
  AlertTriangle,
  Layers,
  Database,
  ArrowRight,
} from 'lucide-angular';
import { RiskService } from '../../core/services/risk.service';
import {
  RawTransactionEvent,
  RiskEvaluateResponse,
  MerchantConfigResponse,
  MerchantHealthResponse,
} from '../../core/models/risk.models';
import { DecisionBadgeComponent } from '../../shared/components/decision-badge.component';
import { RiskBadgeComponent } from '../../shared/components/risk-badge.component';
import { ScoreMeterComponent } from '../../shared/components/score-meter.component';

@Component({
  selector: 'app-integration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    DecisionBadgeComponent,
    RiskBadgeComponent,
  ],
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-slate-100 tracking-tight">Merchant Integration & Risk API</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              API v1 Live
            </span>
          </div>
          <p class="text-sm text-slate-400 mt-1">
            API-first merchant risk evaluation gateway. Submit raw, observable checkout events — the platform derives behavioral and graph features automatically.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            (click)="refreshHealth()"
            [disabled]="isLoadingHealth()"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
          >
            <lucide-icon name="refresh-cw" [size]="14" [class.animate-spin]="isLoadingHealth()"></lucide-icon>
            Check API Status
          </button>
        </div>
      </div>

      <!-- Integration Status & API Key Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <!-- Status Card -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Gateway Status</span>
            <span class="flex h-2.5 w-2.5 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-xl font-bold text-slate-100">{{ healthStatus()?.integration_status === 'connected' ? 'Connected & Ready' : 'Connecting...' }}</span>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Merchant: <span class="text-indigo-400 font-mono">{{ apiKeyMerchantId() }}</span> ({{ healthStatus()?.environment || 'development' }})
          </p>
        </div>

        <!-- Endpoint URL Card -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Evaluation Endpoint</span>
            <lucide-icon name="server" [size]="16" class="text-slate-400"></lucide-icon>
          </div>
          <div class="mt-3">
            <code class="text-xs font-mono text-indigo-300 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-800/40 select-all block truncate">
              POST /api/v1/risk/evaluate
            </code>
          </div>
          <p class="text-xs text-slate-400 mt-1">Accepts raw JSON checkouts with Idempotency-Key</p>
        </div>

        <!-- API Key Card -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Merchant API Key</span>
            <lucide-icon name="key" [size]="16" class="text-amber-400"></lucide-icon>
          </div>
          <div class="mt-2 flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5">
            <span class="text-xs font-mono text-slate-300 tracking-wider">
              {{ showKey() ? activeApiKey : 'ars_live_••••••••••••••••••••' }}
            </span>
            <div class="flex items-center gap-1.5">
              <button
                (click)="toggleShowKey()"
                class="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                title="Toggle Visibility"
              >
                {{ showKey() ? 'Hide' : 'Show' }}
              </button>
              <button
                (click)="copyApiKey()"
                class="text-slate-400 hover:text-indigo-400 transition-colors p-1"
                title="Copy API Key"
              >
                <lucide-icon [name]="copiedKey() ? 'check' : 'copy'" [size]="13" [class.text-emerald-400]="copiedKey()"></lucide-icon>
              </button>
            </div>
          </div>
          <p class="text-xs text-slate-400 mt-1">Pass in <code class="text-slate-300">X-API-Key</code> or <code class="text-slate-300">Authorization: Bearer</code></p>
        </div>
      </div>

      <!-- Quick Start Snippets & Required Data Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Integration Code Examples -->
        <div class="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div class="flex items-center gap-2">
              <lucide-icon name="code" [size]="18" class="text-indigo-400"></lucide-icon>
              <h3 class="text-sm font-semibold text-slate-200">Integration Quick Start</h3>
            </div>
            <div class="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                (click)="activeCodeTab = 'curl'"
                [class.bg-slate-800]="activeCodeTab === 'curl'"
                [class.text-slate-100]="activeCodeTab === 'curl'"
                class="px-3 py-1 rounded-md text-slate-400 font-medium transition-colors"
              >
                cURL
              </button>
              <button
                (click)="activeCodeTab = 'ts'"
                [class.bg-slate-800]="activeCodeTab === 'ts'"
                [class.text-slate-100]="activeCodeTab === 'ts'"
                class="px-3 py-1 rounded-md text-slate-400 font-medium transition-colors"
              >
                TypeScript / Node
              </button>
            </div>
          </div>

          <div class="mt-4 flex-1">
            <pre *ngIf="activeCodeTab === 'curl'" class="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto whitespace-pre leading-relaxed"><code>curl -X POST http://127.0.0.1:8000/api/v1/risk/evaluate \
  -H "X-API-Key: {{ activeApiKey }}" \
  -H "Idempotency-Key: tx_req_unique_001" \
  -H "Content-Type: application/json" \
  -d '&#123;
    "transaction_id": "tx_live_1001",
    "user_id": "cust_9876",
    "amount": 249.99,
    "currency": "INR",
    "timestamp": "2026-08-25T14:30:00Z",
    "product_category": "electronics",
    "device_id": "dev_fp_abc123",
    "ip_address": "203.0.113.195",
    "payment_method_id": "pm_tok_card_99",
    "shipping_address_id": "addr_99",
    "billing_address_id": "addr_99",
    "email_domain": "buyer&#64;gmail.com",
    "promo_code": "WELCOME10"
  &#125;'</code></pre>

            <pre *ngIf="activeCodeTab === 'ts'" class="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed"><code>import axios from 'axios';

const riskResponse = await axios.post('http://127.0.0.1:8000/api/v1/risk/evaluate', &#123;
  transaction_id: 'tx_live_1001',
  user_id: 'cust_9876',
  amount: 249.99,
  currency: 'INR',
  timestamp: new Date().toISOString(),
  product_category: 'electronics',
  device_id: 'dev_fp_abc123',
  ip_address: '203.0.113.195',
  payment_method_id: 'pm_tok_card_99',
  shipping_address_id: 'addr_99',
  billing_address_id: 'addr_99',
  email_domain: 'buyer&#64;gmail.com',
  promo_code: 'WELCOME10',
&#125;, &#123;
  headers: &#123;
    'X-API-Key': '{{ activeApiKey }}',
    'Idempotency-Key': 'tx_req_unique_001',
  &#125;,
&#125;);

console.log('Risk Decision:', riskResponse.data.decision); // APPROVE | REVIEW | BLOCK</code></pre>
          </div>
        </div>

        <!-- Required Fields Guide -->
        <div class="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 border-b border-slate-800 pb-4">
              <lucide-icon name="layers" [size]="18" class="text-emerald-400"></lucide-icon>
              <h3 class="text-sm font-semibold text-slate-200">Observable Schema Checklist</h3>
            </div>
            <p class="text-xs text-slate-400 mt-3">
              Merchants only send observable event data. All 33 graph & behavioral ML features are derived in-memory by Abuse-Ring Sentinel.
            </p>
            <ul class="mt-4 space-y-2 text-xs">
              <li class="flex items-center gap-2 text-slate-300">
                <lucide-icon name="check" [size]="14" class="text-emerald-400 shrink-0"></lucide-icon>
                <span><strong>Transaction & User ID</strong>: Merchant unique identifiers</span>
              </li>
              <li class="flex items-center gap-2 text-slate-300">
                <lucide-icon name="check" [size]="14" class="text-emerald-400 shrink-0"></lucide-icon>
                <span><strong>Amount & Currency</strong>: Monetary values in standard format</span>
              </li>
              <li class="flex items-center gap-2 text-slate-300">
                <lucide-icon name="check" [size]="14" class="text-emerald-400 shrink-0"></lucide-icon>
                <span><strong>Timestamp</strong>: ISO-8601 UTC checkout timestamp</span>
              </li>
              <li class="flex items-center gap-2 text-slate-300">
                <lucide-icon name="check" [size]="14" class="text-emerald-400 shrink-0"></lucide-icon>
                <span><strong>Entity Fingerprints</strong>: Device ID, IP subnet, Payment token</span>
              </li>
              <li class="flex items-center gap-2 text-slate-300">
                <lucide-icon name="check" [size]="14" class="text-emerald-400 shrink-0"></lucide-icon>
                <span><strong>Address & Voucher</strong>: Billing/Shipping IDs, promo voucher</span>
              </li>
            </ul>
          </div>

          <div class="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2.5">
            <lucide-icon name="alert-triangle" [size]="16" class="text-amber-400 shrink-0 mt-0.5"></lucide-icon>
            <div>
              <strong>Security Guarantee</strong>: Never pass raw card PANs or CVVs. The API strictly rejects un-tokenized payment credentials.
            </div>
          </div>
        </div>
      </div>

      <!-- Live Risk API Tester Studio -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <lucide-icon name="terminal" [size]="18" class="text-indigo-400"></lucide-icon>
              <h3 class="text-base font-semibold text-slate-100">Live Risk API Tester</h3>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Submit raw observable checkout data to <code class="text-indigo-300 font-mono">POST /api/v1/risk/evaluate</code> and observe live GBDT inference.
            </p>
          </div>

          <!-- Scenario Presets -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs text-slate-400 font-medium">Load Preset:</span>
            <button
              (click)="loadPreset('new_user')"
              class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              New Legitimate User
            </button>
            <button
              (click)="loadPreset('sybil_attacker')"
              class="px-2.5 py-1 rounded bg-rose-950/40 hover:bg-rose-900/40 text-xs font-medium text-rose-300 border border-rose-800/50 transition-colors"
            >
              Sybil Ring Collusion
            </button>
            <button
              (click)="loadPreset('household')"
              class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              Household Shared Wi-Fi
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          <!-- Raw Transaction Input Form -->
          <div class="lg:col-span-6 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">Transaction ID</label>
                <input
                  type="text"
                  [(ngModel)]="testerForm.transaction_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">User / Customer ID</label>
                <input
                  type="text"
                  [(ngModel)]="testerForm.user_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">Amount</label>
                <input
                  type="number"
                  [(ngModel)]="testerForm.amount"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">Currency</label>
                <input
                  type="text"
                  [(ngModel)]="testerForm.currency"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">Product Category</label>
                <input
                  type="text"
                  [(ngModel)]="testerForm.product_category"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">Device Fingerprint ID</label>
                <input
                  type="text"
                  [(ngModel)]="testerForm.device_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">IP Address</label>
                <input
                  type="text"
                  [(ngModel)]="testerForm.ip_address"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">Payment Method ID</label>
                <input
                  type="text"
                  [(ngModel)]="testerForm.payment_method_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">Voucher / Promo Code</label>
                <input
                  type="text"
                  [(ngModel)]="testerForm.promo_code"
                  placeholder="Optional promo code"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">Shipping Address ID</label>
                <input
                  type="text"
                  [(ngModel)]="testerForm.shipping_address_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">Billing Address ID</label>
                <input
                  type="text"
                  [(ngModel)]="testerForm.billing_address_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Customer Email / Domain</label>
              <input
                type="text"
                [(ngModel)]="testerForm.email_domain"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div class="pt-2">
              <button
                (click)="evaluateRawTransaction()"
                [disabled]="isEvaluating()"
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                <lucide-icon name="zap" [size]="15" [class.animate-pulse]="isEvaluating()"></lucide-icon>
                {{ isEvaluating() ? 'Evaluating via Model F...' : 'Evaluate Transaction (POST /api/v1/risk/evaluate)' }}
              </button>
            </div>
          </div>

          <!-- Evaluation Results Panel -->
          <div class="lg:col-span-6 bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div *ngIf="lastResult(); else emptyResult">
              <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Real-Time Risk Decision</span>
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 rounded text-[11px] font-mono border"
                    [ngClass]="{
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': lastResult()?.data_quality?.status === 'cold_start',
                      'bg-indigo-500/10 text-indigo-400 border-indigo-500/20': lastResult()?.data_quality?.status === 'sufficient_history'
                    }"
                  >
                    {{ lastResult()?.data_quality?.status === 'cold_start' ? '● Cold Start' : '● Sufficient History' }}
                  </span>
                  <app-decision-badge [decision]="lastResult()!.decision"></app-decision-badge>
                </div>
              </div>

              <!-- Score & Probability -->
              <div class="mt-5 grid grid-cols-2 gap-4 items-center">
                <div>
                  <div class="text-xs text-slate-400 font-medium">Calculated Risk Score</div>
                  <div class="text-3xl font-black tracking-tight mt-1 text-slate-100 font-mono">
                    {{ (lastResult()!.risk_score * 100).toFixed(2) }}%
                  </div>
                  <div class="mt-1">
                    <app-risk-badge [level]="lastResult()!.risk_level"></app-risk-badge>
                  </div>
                </div>

                <div class="bg-slate-900 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1.5 font-mono text-slate-300">
                  <div class="flex justify-between">
                    <span class="text-slate-400">Prior TXs:</span>
                    <span class="font-bold text-slate-100">{{ lastResult()!.data_quality.historical_transactions }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Connected Entities:</span>
                    <span class="font-bold text-slate-100">{{ lastResult()!.data_quality.graph_connected_entities }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Inference Latency:</span>
                    <span class="font-bold text-emerald-400">{{ lastResult()!.latency_ms }} ms</span>
                  </div>
                </div>
              </div>

              <!-- Reason Codes -->
              <div class="mt-5">
                <div class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Ranked Decision Drivers</div>
                <div class="space-y-2">
                  <div
                    *ngFor="let reason of lastResult()!.reason_codes"
                    class="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs"
                  >
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-indigo-300 text-[11px]">{{ reason.code }}</span>
                    </div>
                    <p class="text-slate-300 mt-1 text-[11px]">{{ reason.message }}</p>
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
                <span>Model: {{ lastResult()!.model_version }}</span>
                <span>Request: {{ lastResult()!.request_id.slice(0, 8) }}...</span>
              </div>
            </div>

            <ng-template #emptyResult>
              <div class="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <lucide-icon name="server" [size]="36" class="text-slate-700 mb-3"></lucide-icon>
                <div class="text-sm font-semibold text-slate-300">Ready to Evaluate</div>
                <p class="text-xs text-slate-400 max-w-xs mt-1">
                  Fill in the observable transaction fields on the left and click Evaluate to execute live Model F inference.
                </p>
              </div>
            </ng-template>

            <!-- Error State -->
            <div *ngIf="evalError()" class="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex items-start gap-2">
              <lucide-icon name="shield-alert" [size]="16" class="text-rose-400 shrink-0 mt-0.5"></lucide-icon>
              <div>
                <strong>Evaluation Failed</strong>: {{ evalError() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class IntegrationComponent implements OnInit {
  private riskService = inject(RiskService);

  readonly activeApiKey = 'ars_live_test_merchant_01';
  activeCodeTab: 'curl' | 'ts' = 'curl';
  readonly showKey = signal(false);
  readonly copiedKey = signal(false);
  readonly isEvaluating = signal(false);
  readonly isLoadingHealth = signal(false);
  readonly evalError = signal<string | null>(null);

  readonly healthStatus = signal<MerchantHealthResponse | null>(null);
  readonly lastResult = signal<RiskEvaluateResponse | null>(null);

  testerForm: RawTransactionEvent = {
    transaction_id: 'tx_live_manual_001',
    user_id: 'cust_alpha_01',
    amount: 149.99,
    currency: 'INR',
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    product_category: 'electronics',
    device_id: 'dev_fp_alpha_01',
    ip_address: '192.168.1.10',
    payment_method_id: 'pm_card_alpha_01',
    shipping_address_id: 'addr_ship_alpha_01',
    billing_address_id: 'addr_ship_alpha_01',
    email_domain: 'buyer@example.com',
    promo_code: '',
  };

  ngOnInit() {
    this.refreshHealth();
  }

  apiKeyMerchantId(): string {
    return 'merchant_dev_01';
  }

  toggleShowKey() {
    this.showKey.update((v) => !v);
  }

  copyApiKey() {
    navigator.clipboard.writeText(this.activeApiKey);
    this.copiedKey.set(true);
    setTimeout(() => this.copiedKey.set(false), 2000);
  }

  refreshHealth() {
    this.isLoadingHealth.set(true);
    this.riskService.getMerchantHealth(this.activeApiKey).subscribe({
      next: (res) => {
        this.healthStatus.set(res);
        this.isLoadingHealth.set(false);
      },
      error: () => {
        this.isLoadingHealth.set(false);
      },
    });
  }

  loadPreset(presetType: 'new_user' | 'sybil_attacker' | 'household') {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (presetType === 'new_user') {
      this.testerForm = {
        transaction_id: `tx_new_${Math.floor(Math.random() * 9000 + 1000)}`,
        user_id: `cust_new_${Math.floor(Math.random() * 9000 + 1000)}`,
        amount: 89.99,
        currency: 'INR',
        timestamp: nowStr,
        product_category: 'books_and_media',
        device_id: `dev_clean_${Math.floor(Math.random() * 9000 + 1000)}`,
        ip_address: '203.0.113.45',
        payment_method_id: `pm_clean_${Math.floor(Math.random() * 9000 + 1000)}`,
        shipping_address_id: 'addr_clean_01',
        billing_address_id: 'addr_clean_01',
        email_domain: 'customer@gmail.com',
        promo_code: '',
      };
    } else if (presetType === 'sybil_attacker') {
      this.testerForm = {
        transaction_id: `tx_sybil_${Math.floor(Math.random() * 9000 + 1000)}`,
        user_id: `attacker_sybil_${Math.floor(Math.random() * 9000 + 1000)}`,
        amount: 399.00,
        currency: 'INR',
        timestamp: nowStr,
        product_category: 'electronics',
        device_id: 'dev_sybil_ring_escalate_01',
        ip_address: '198.51.100.22',
        payment_method_id: 'pm_sybil_card_escalate_01',
        shipping_address_id: 'addr_sybil_drop_01',
        billing_address_id: 'addr_sybil_drop_01',
        email_domain: 'burner@tempmail.org',
        promo_code: 'FREE50',
      };
    } else if (presetType === 'household') {
      this.testerForm = {
        transaction_id: `tx_house_${Math.floor(Math.random() * 9000 + 1000)}`,
        user_id: `family_member_${Math.floor(Math.random() * 9000 + 1000)}`,
        amount: 45.00,
        currency: 'INR',
        timestamp: nowStr,
        product_category: 'groceries',
        device_id: `dev_family_phone_${Math.floor(Math.random() * 9000 + 1000)}`,
        ip_address: '192.168.1.1',
        payment_method_id: `pm_family_card_${Math.floor(Math.random() * 9000 + 1000)}`,
        shipping_address_id: 'addr_home_residence',
        billing_address_id: 'addr_home_residence',
        email_domain: 'family@yahoo.com',
        promo_code: '',
      };
    }
  }

  evaluateRawTransaction() {
    this.isEvaluating.set(true);
    this.evalError.set(null);

    this.riskService.evaluateRawTransaction(this.testerForm, this.activeApiKey).subscribe({
      next: (response) => {
        this.lastResult.set(response);
        this.isEvaluating.set(false);
      },
      error: (err) => {
        this.evalError.set(err.message || 'API request failed.');
        this.isEvaluating.set(false);
      },
    });
  }
}
