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
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
} from 'lucide-angular';
import { RiskService } from '../../core/services/risk.service';
import { MerchantService } from '../../core/services/merchant.service';
import { AuthService } from '../../core/services/auth.service';
import {
  RawTransactionEvent,
  RiskEvaluateResponse,
  MerchantConfigResponse,
  MerchantHealthResponse,
  MerchantIntegrationConfig,
  ActionTestResponse,
} from '../../core/models/risk.models';
import { DecisionBadgeComponent } from '../../shared/components/decision-badge.component';
import { RiskBadgeComponent } from '../../shared/components/risk-badge.component';

@Component({
  selector: 'app-integration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    DecisionBadgeComponent,
  ],
  template: `
    <div class="space-y-8 animate-fade-in pb-12">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-slate-100 tracking-tight">Merchant Integration & Action Gateway</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              API v1 Live
            </span>
          </div>
          <p class="text-sm text-slate-400 mt-1">
            Configure inbound transaction evaluation and outbound merchant action execution with HMAC-SHA256 signing.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            (click)="refreshHealth()"
            [disabled]="isLoadingHealth()"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
          >
            <lucide-icon name="refresh-cw" [size]="14" [class.animate-spin]="isLoadingHealth()"></lucide-icon>
            Check Gateway Health
          </button>
        </div>
      </div>

      <!-- Top Cards -->
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
            <span class="text-xl font-bold text-slate-100">{{ healthStatus()?.integration_status === 'connected' ? 'Connected & Ready' : 'Online' }}</span>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Merchant: <span class="text-indigo-400 font-mono">{{ currentMerchantId() }}</span>
          </p>
        </div>

        <!-- Inbound Evaluation Endpoint -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Inbound Risk API</span>
            <lucide-icon name="server" [size]="16" class="text-slate-400"></lucide-icon>
          </div>
          <div class="mt-3">
            <code class="text-xs font-mono text-indigo-300 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-800/40 select-all block truncate">
              POST /api/v1/risk/evaluate
            </code>
          </div>
          <p class="text-xs text-slate-400 mt-1">Inbound transaction payload receiver</p>
        </div>

        <!-- API Key Card -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Active API Key</span>
            <lucide-icon name="key" [size]="16" class="text-amber-400"></lucide-icon>
          </div>
          <div class="mt-2 flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5">
            <span class="text-xs font-mono text-slate-300 tracking-wider">
              {{ currentApiKeyMasked() }}
            </span>
            <button
              (click)="copyApiKey()"
              class="text-slate-400 hover:text-indigo-400 transition-colors p-1"
              title="Copy API Key"
            >
              <lucide-icon [name]="copiedKey() ? 'check' : 'copy'" [size]="13" [class.text-emerald-400]="copiedKey()"></lucide-icon>
            </button>
          </div>
          <p class="text-xs text-slate-400 mt-1">Used in <code class="text-slate-300">X-API-Key</code> request header</p>
        </div>
      </div>

      <!-- Real Database Architecture & MySQL Persistence Section -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <lucide-icon name="database" [size]="16"></lucide-icon>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-semibold text-slate-100">MySQL Database Architecture & Persistence Layer</h3>
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                  [ngClass]="{
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40': dbSummary()?.status === 'connected',
                    'bg-rose-500/20 text-rose-300 border border-rose-500/40': dbSummary()?.status !== 'connected'
                  }"
                >
                  {{ dbSummary()?.status === 'connected' ? 'MYSQL CONNECTED' : 'DATABASE DEGRADED' }}
                </span>
              </div>
              <p class="text-xs text-slate-400">Real operational database metrics verified directly from MySQL backend.</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              (click)="refreshDatabaseSummary()"
              [disabled]="isLoadingDb()"
              class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-all disabled:opacity-50"
            >
              <lucide-icon name="refresh-cw" [size]="13" [class.animate-spin]="isLoadingDb()"></lucide-icon>
              <span>Refresh DB Counts</span>
            </button>
          </div>
        </div>

        <!-- Database Metrics Grid -->
        <div class="mt-5 grid grid-cols-2 md:grid-cols-6 gap-3.5 font-mono text-xs">
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-sans block mb-1">Engine</span>
            <span class="text-white font-bold">{{ dbSummary()?.engine?.toUpperCase() || 'MYSQL' }}</span>
          </div>
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-sans block mb-1">Transactions</span>
            <span class="text-emerald-400 font-bold">{{ dbSummary()?.counts?.transactions || 0 }}</span>
          </div>
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-sans block mb-1">Evaluations</span>
            <span class="text-indigo-400 font-bold">{{ dbSummary()?.counts?.risk_evaluations || 0 }}</span>
          </div>
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-sans block mb-1">Actions</span>
            <span class="text-amber-400 font-bold">{{ dbSummary()?.counts?.merchant_actions || 0 }}</span>
          </div>
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-sans block mb-1">Graph Edges</span>
            <span class="text-rose-400 font-bold">{{ dbSummary()?.counts?.entity_relationships || 0 }}</span>
          </div>
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-sans block mb-1">DB Latency</span>
            <span class="text-slate-200 font-bold">{{ dbSummary()?.latency_ms ? dbSummary()?.latency_ms + 'ms' : '<1ms' }}</span>
          </div>
        </div>
      </div>

      <!-- Outbound Merchant Action Configuration Section -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <lucide-icon name="send" [size]="16"></lucide-icon>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-100">Outbound Merchant Action Execution & Webhooks</h3>
              <p class="text-xs text-slate-400">Sentinel dispatches real-time signed action webhooks (BLOCK/APPROVE/REVIEW) to your backend.</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              (click)="testConnection()"
              [disabled]="isTestingConnection()"
              class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-semibold text-indigo-300 transition-all disabled:opacity-50"
            >
              <lucide-icon name="refresh-cw" [size]="13" [class.animate-spin]="isTestingConnection()"></lucide-icon>
              <span>{{ isTestingConnection() ? 'Testing...' : 'Test Merchant Connection' }}</span>
            </button>
            <button
              (click)="saveIntegrationConfig()"
              [disabled]="isSavingConfig()"
              class="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <span>{{ isSavingConfig() ? 'Saving...' : 'Save Settings' }}</span>
            </button>
          </div>
        </div>

        <!-- Connection Test Result Banner -->
        <div *ngIf="testResult()" class="mt-4 p-4 rounded-xl border" [ngClass]="{
          'bg-emerald-950/30 border-emerald-500/30 text-emerald-200': testResult()?.status === 'CONNECTED',
          'bg-rose-950/30 border-rose-500/30 text-rose-200': testResult()?.status === 'FAILED'
        }">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-2.5">
              <lucide-icon [name]="testResult()?.status === 'CONNECTED' ? 'check-circle-2' : 'x-circle'" [size]="20" [class.text-emerald-400]="testResult()?.status === 'CONNECTED'" [class.text-rose-400]="testResult()?.status === 'FAILED'"></lucide-icon>
              <div>
                <span class="text-xs font-bold uppercase tracking-wider">
                  {{ testResult()?.status === 'CONNECTED' ? 'Connection Successful — Endpoint Active' : 'Connection Failed' }}
                </span>
                <p class="text-xs text-slate-300 mt-0.5" *ngIf="testResult()?.status === 'CONNECTED'">
                  Merchant backend responded with HTTP {{ testResult()?.http_status }} in {{ testResult()?.latency_ms }} ms.
                </p>
                <p class="text-xs text-rose-300 mt-0.5" *ngIf="testResult()?.status === 'FAILED'">
                  Error: {{ testResult()?.error || 'Target endpoint unreachable' }}
                </p>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-400 shrink-0">{{ testResult()?.timestamp | date:'HH:mm:ss' }}</span>
          </div>
        </div>

        <!-- Configuration Form -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">Action Webhook URL</label>
            <input
              type="text"
              [(ngModel)]="configForm.action_endpoint_url"
              placeholder="e.g. http://127.0.0.1:8001/api/risk/action or https://api.store.com/risk/action"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
            />
            <p class="text-[11px] text-slate-400 mt-1">Endpoint where VigilAI delivers signed action requests.</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">Webhook Signing Secret (HMAC-SHA256)</label>
            <input
              type="password"
              [(ngModel)]="configForm.webhook_secret"
              [placeholder]="configForm.webhook_secret_masked || 'Enter signing secret'"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
            />
            <p class="text-[11px] text-slate-400 mt-1">Used to compute the <code class="text-indigo-300">X-Abuse-Sentinel-Signature</code> header.</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">Auth Bearer Token</label>
            <input
              type="password"
              [(ngModel)]="configForm.auth_token"
              [placeholder]="configForm.auth_token_masked || 'Optional Authorization Token'"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
            />
            <p class="text-[11px] text-slate-400 mt-1">Sent in the <code class="text-indigo-300">Authorization: Bearer</code> header.</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1.5">Timeout (Seconds)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="30"
                [(ngModel)]="configForm.timeout_seconds"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1.5">Max Retries</label>
              <input
                type="number"
                min="0"
                max="5"
                [(ngModel)]="configForm.max_retries"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Start Snippets -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Integration Code Examples -->
        <div class="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div class="flex items-center gap-2">
              <lucide-icon name="code" [size]="18" class="text-indigo-400"></lucide-icon>
              <h3 class="text-sm font-semibold text-slate-200">Inbound Risk API Snippets</h3>
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
                TypeScript
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
    "email_domain": "buyer&#64;gmail.com"
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
  email_domain: 'buyer&#64;gmail.com'
&#125;, &#123;
  headers: &#123;
    'X-API-Key': '{{ activeApiKey }}',
    'Idempotency-Key': 'idemp_tx_1001',
    'Content-Type': 'application/json'
  &#125;
&#125;);</code></pre>
          </div>
        </div>

        <!-- Interactive Checkout Simulator -->
        <div class="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 class="text-sm font-semibold text-slate-200">Interactive Checkout & Action Simulator</h3>
              <div class="flex gap-1.5">
                <button
                  (click)="loadPreset('sybil')"
                  class="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                >
                  Sybil Attack
                </button>
                <button
                  (click)="loadPreset('trusted')"
                  class="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                >
                  Legitimate
                </button>
              </div>
            </div>

            <div class="mt-4 space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-slate-400 mb-1">Transaction ID</label>
                  <input
                    type="text"
                    [(ngModel)]="testerForm.transaction_id"
                    class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-xs text-slate-400 mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    [(ngModel)]="testerForm.amount"
                    class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-slate-400 mb-1">User ID</label>
                  <input
                    type="text"
                    [(ngModel)]="testerForm.user_id"
                    class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-xs text-slate-400 mb-1">Device ID</label>
                  <input
                    type="text"
                    [(ngModel)]="testerForm.device_id"
                    class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <button
                (click)="evaluateRawTransaction()"
                [disabled]="isEvaluating()"
                class="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                <lucide-icon name="zap" [size]="14" [class.animate-pulse]="isEvaluating()"></lucide-icon>
                <span>{{ isEvaluating() ? 'Evaluating & Dispatching Action...' : 'Submit Evaluation (POST /api/v1/risk/evaluate)' }}</span>
              </button>
            </div>
          </div>

          <!-- Evaluation & Action Result -->
          <div *ngIf="lastResult()" class="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="text-xs font-bold text-slate-300">Model Decision:</span>
              <app-decision-badge [decision]="lastResult()!.decision"></app-decision-badge>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>Score: <span class="font-bold text-rose-400">{{ (lastResult()!.risk_score * 100).toFixed(2) }}%</span></div>
              <div>Latency: <span class="text-emerald-400">{{ lastResult()!.latency_ms }} ms</span></div>
            </div>

            <!-- Merchant Action Execution Status -->
            <div *ngIf="lastResult()?.merchant_action" class="p-2.5 rounded-lg border text-xs" [ngClass]="{
              'bg-emerald-950/20 border-emerald-500/20 text-emerald-300': lastResult()?.merchant_action?.status === 'EXECUTED',
              'bg-rose-950/20 border-rose-500/20 text-rose-300': lastResult()?.merchant_action?.status === 'FAILED' || lastResult()?.merchant_action?.status === 'TIMEOUT',
              'bg-slate-900 border-slate-800 text-slate-300': lastResult()?.merchant_action?.status === 'NOT_CONFIGURED'
            }">
              <div class="flex items-center justify-between">
                <span class="font-bold">Merchant Action: {{ lastResult()?.merchant_action?.action || 'NONE' }}</span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold" [ngClass]="{
                  'bg-emerald-500/20 text-emerald-400': lastResult()?.merchant_action?.status === 'EXECUTED',
                  'bg-rose-500/20 text-rose-400': lastResult()?.merchant_action?.status === 'FAILED',
                  'bg-slate-800 text-slate-400': lastResult()?.merchant_action?.status === 'NOT_CONFIGURED'
                }">
                  {{ lastResult()?.merchant_action?.status }}
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">{{ lastResult()?.merchant_action?.merchant_message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class IntegrationComponent implements OnInit {
  private riskService = inject(RiskService);
  private merchantService = inject(MerchantService);
  private authService = inject(AuthService);

  readonly activeApiKey = 'ars_live_test_merchant_01';
  activeCodeTab: 'curl' | 'ts' = 'curl';
  readonly copiedKey = signal(false);
  readonly isEvaluating = signal(false);
  readonly isLoadingHealth = signal(false);
  readonly isSavingConfig = signal(false);
  readonly isTestingConnection = signal(false);
  readonly evalError = signal<string | null>(null);

  readonly healthStatus = signal<MerchantHealthResponse | null>(null);
  readonly lastResult = signal<RiskEvaluateResponse | null>(null);
  readonly testResult = signal<ActionTestResponse | null>(null);

  configForm: MerchantIntegrationConfig = {
    merchant_id: 'merchant_dev_01',
    action_endpoint_url: 'http://127.0.0.1:8001/api/risk/action',
    auth_header_name: 'Authorization',
    auth_token: '',
    auth_token_masked: '••••••••123',
    webhook_secret: '',
    webhook_secret_masked: '••••••••_99',
    timeout_seconds: 3.0,
    max_retries: 2,
    is_active: true,
  };

  testerForm: RawTransactionEvent = {
    transaction_id: 'tx_live_manual_001',
    user_id: 'cust_alpha_01',
    amount: 149.99,
    currency: 'INR',
    timestamp: new Date().toISOString(),
    product_category: 'electronics',
    device_id: 'dev_fp_alpha_01',
    ip_address: '192.168.1.10',
    payment_method_id: 'pm_card_alpha_01',
    shipping_address_id: 'addr_ship_alpha_01',
    billing_address_id: 'addr_ship_alpha_01',
    email_domain: 'buyer@example.com',
    promo_code: '',
  };

  readonly dbSummary = signal<any | null>(null);
  readonly isLoadingDb = signal(false);

  ngOnInit() {
    this.refreshHealth();
    this.refreshDatabaseSummary();
    this.loadIntegrationConfig();
  }

  currentMerchantId(): string {
    return this.authService.currentUser()?.merchant_id || 'merchant_dev_01';
  }

  currentApiKeyMasked(): string {
    return this.authService.currentUser()?.api_key_masked || 'ars_live_••••••••';
  }

  copyApiKey() {
    navigator.clipboard.writeText(this.activeApiKey);
    this.copiedKey.set(true);
    setTimeout(() => this.copiedKey.set(false), 2000);
  }

  refreshDatabaseSummary() {
    this.isLoadingDb.set(true);
    this.merchantService.getDatabaseSummary().subscribe({
      next: (summary) => {
        this.dbSummary.set(summary);
        this.isLoadingDb.set(false);
      },
      error: (err) => {
        this.dbSummary.set({
          engine: 'mysql',
          status: 'disconnected',
          error: err.message || 'Database unreachable',
          counts: {},
        });
        this.isLoadingDb.set(false);
      },
    });
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

  loadIntegrationConfig() {
    this.merchantService.getIntegrationConfig().subscribe({
      next: (cfg) => {
        if (cfg) {
          this.configForm = { ...this.configForm, ...cfg };
        }
      },
      error: () => {},
    });
  }

  saveIntegrationConfig() {
    this.isSavingConfig.set(true);
    this.merchantService.updateIntegrationConfig(this.configForm).subscribe({
      next: (cfg) => {
        this.configForm = { ...this.configForm, ...cfg };
        this.isSavingConfig.set(false);
      },
      error: () => {
        this.isSavingConfig.set(false);
      },
    });
  }

  testConnection() {
    this.isTestingConnection.set(true);
    this.testResult.set(null);
    this.merchantService.testActionEndpoint({
      endpoint_url: this.configForm.action_endpoint_url,
      auth_token: this.configForm.auth_token,
      webhook_secret: this.configForm.webhook_secret,
    }).subscribe({
      next: (res) => {
        this.testResult.set(res);
        this.isTestingConnection.set(false);
      },
      error: (err) => {
        this.testResult.set({
          status: 'FAILED',
          http_status: err.status || 500,
          latency_ms: 0,
          endpoint_url: this.configForm.action_endpoint_url || '',
          request_id: 'err_' + Date.now(),
          timestamp: new Date().toISOString(),
          error: err.message || 'Connection test failed',
        });
        this.isTestingConnection.set(false);
      },
    });
  }

  loadPreset(presetType: 'sybil' | 'trusted') {
    const timestamp = new Date().toISOString();
    const count = Date.now().toString().slice(-4);

    if (presetType === 'sybil') {
      this.testerForm = {
        transaction_id: `tx_sybil_${count}`,
        user_id: `attacker_sybil_${count}`,
        amount: 4999.00,
        currency: 'INR',
        timestamp: timestamp,
        product_category: 'electronics',
        device_id: 'dev_sybil_ring_escalate_01',
        ip_address: '198.51.100.22',
        payment_method_id: 'pm_sybil_card_escalate_01',
        shipping_address_id: 'addr_sybil_drop_01',
        billing_address_id: 'addr_sybil_drop_01',
        email_domain: 'burner@tempmail.org',
        promo_code: 'FREE50',
      };
    } else {
      this.testerForm = {
        transaction_id: `tx_trusted_${count}`,
        user_id: `cust_trusted_${count}`,
        amount: 89.99,
        currency: 'INR',
        timestamp: timestamp,
        product_category: 'books_and_media',
        device_id: `dev_clean_${count}`,
        ip_address: '203.0.113.45',
        payment_method_id: `pm_clean_${count}`,
        shipping_address_id: 'addr_clean_01',
        billing_address_id: 'addr_clean_01',
        email_domain: 'customer@gmail.com',
        promo_code: '',
      };
    }
  }

  evaluateRawTransaction() {
    this.isEvaluating.set(true);
    this.evalError.set(null);

    this.merchantService.evaluateLiveTransaction(this.testerForm).subscribe({
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
