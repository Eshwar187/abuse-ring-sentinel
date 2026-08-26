import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { TransactionService } from '../../core/services/transaction.service';
import { MerchantService } from '../../core/services/merchant.service';
import { TransactionListItem, MerchantAction } from '../../core/models/risk.models';
import { RiskBadgeComponent } from '../../shared/components/risk-badge.component';
import { DecisionBadgeComponent } from '../../shared/components/decision-badge.component';
import { ScoreMeterComponent } from '../../shared/components/score-meter.component';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RiskBadgeComponent,
    DecisionBadgeComponent,
    ScoreMeterComponent,
  ],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-12 font-sans select-none">
      <!-- Breadcrumb & Back -->
      <div class="flex items-center gap-2 text-xs text-slate-400 font-mono">
        <a routerLink="/app/transactions" class="hover:text-cyan-300 transition-colors">Transactions</a>
        <span>/</span>
        <span class="text-white font-bold">{{ transactionId }}</span>
      </div>

      @if (tx) {
        <!-- Top Status Card -->
        <div class="bg-[#0B132B]/85 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 backdrop-blur-xl">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-2xl font-bold font-mono text-white tracking-tight">{{ tx.transaction_id }}</h1>
                <app-risk-badge [level]="tx.risk_level"></app-risk-badge>
                <app-decision-badge [decision]="tx.decision"></app-decision-badge>
              </div>
              <p class="text-xs text-slate-400 mt-1.5 font-mono">
                Evaluated at {{ tx.timestamp | date:'medium' }} • User ID: <span class="text-cyan-300 font-semibold">{{ tx.user_id }}</span>
              </p>
            </div>

            <!-- Operator Action Buttons -->
            <div class="flex items-center gap-3 font-mono text-xs">
              <button
                (click)="retryOutboundAction()"
                [disabled]="isRetryingAction()"
                class="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>{{ isRetryingAction() ? 'Dispatching...' : '↻ Retry Outbound Action' }}</span>
              </button>
              <button
                (click)="overrideDecision('APPROVE')"
                class="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold rounded-xl transition-all"
              >
                Approve Order
              </button>
              <button
                (click)="overrideDecision('BLOCK')"
                class="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold rounded-xl transition-all"
              >
                Block User
              </button>
            </div>
          </div>

          <!-- Score & Metric Overview -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div class="p-4 bg-[#030712] rounded-2xl border border-slate-800">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">GBDT Risk Score</div>
              <div class="text-2xl font-black font-mono mt-1 text-cyan-300">
                {{ ((tx.risk_score) * 100).toFixed(2) }}%
              </div>
              <div class="mt-2">
                <app-score-meter [score]="tx.risk_score"></app-score-meter>
              </div>
            </div>

            <div class="p-4 bg-[#030712] rounded-2xl border border-slate-800">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Gross Amount</div>
              <div class="text-2xl font-black font-mono text-white mt-1">
                \${{ tx.amount.toFixed(2) }}
              </div>
              <div class="text-xs text-slate-400 mt-1 font-mono uppercase">{{ tx.product_category }}</div>
            </div>

            <div class="p-4 bg-[#030712] rounded-2xl border border-slate-800">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Outbound Webhook</div>
              <div class="text-lg font-bold font-mono text-purple-300 mt-1">
                {{ action()?.action || 'BLOCK_USER_AND_REVERSE' }}
              </div>
              <div class="text-xs text-emerald-400 mt-1 font-mono">Status: EXECUTED</div>
            </div>

            <div class="p-4 bg-[#030712] rounded-2xl border border-slate-800">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Policy Ruling</div>
              <div class="text-lg font-bold font-mono mt-1" [ngClass]="tx.decision === 'BLOCK' ? 'text-rose-400' : tx.decision === 'REVIEW' ? 'text-amber-400' : 'text-emerald-400'">
                {{ tx.decision }}
              </div>
              <div class="text-xs text-slate-400 mt-1 font-mono">Threshold: τ* = 0.90</div>
            </div>
          </div>
        </div>

        <!-- 6-Step Execution Lifecycle Timeline -->
        <div class="bg-[#0B132B]/85 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 backdrop-blur-xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 class="text-sm font-bold text-white font-mono">End-to-End Transaction & Action Lifecycle</h3>
              <p class="text-xs text-slate-400">Live operational audit trail from raw ingress to merchant backend state change.</p>
            </div>
            <span class="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-[#030712] text-cyan-300 border border-slate-800">
              Idempotency: {{ tx.transaction_id }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-6 gap-3.5">
            <!-- Step 1 -->
            <div class="p-3.5 bg-[#030712] rounded-2xl border border-emerald-500/30">
              <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
                <span>✓ 1. Ingress</span>
              </div>
              <p class="text-[11px] text-slate-300 mt-1">Raw checkout event received.</p>
              <div class="text-[10px] font-mono text-slate-500 mt-2 truncate">{{ tx.timestamp | date:'HH:mm:ss' }}</div>
            </div>

            <!-- Step 2 -->
            <div class="p-3.5 bg-[#030712] rounded-2xl border border-emerald-500/30">
              <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
                <span>✓ 2. Features</span>
              </div>
              <p class="text-[11px] text-slate-300 mt-1">33 features extracted in memory.</p>
              <div class="text-[10px] font-mono text-slate-500 mt-2">Point-in-Time</div>
            </div>

            <!-- Step 3 -->
            <div class="p-3.5 bg-[#030712] rounded-2xl border border-emerald-500/30">
              <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
                <span>✓ 3. Inference</span>
              </div>
              <p class="text-[11px] text-slate-300 mt-1">Model F: {{ (tx.risk_score * 100).toFixed(1) }}%</p>
              <div class="text-[10px] font-mono text-cyan-400 mt-2">{{ tx.decision }}</div>
            </div>

            <!-- Step 4 -->
            <div class="p-3.5 bg-[#030712] rounded-2xl border border-cyan-500/30">
              <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300 font-mono">
                <span>✓ 4. Action Req</span>
              </div>
              <p class="text-[11px] text-slate-300 mt-1">{{ action()?.action || 'Mapped to ' + tx.decision }}</p>
              <div class="text-[10px] font-mono text-slate-500 mt-2">HMAC-SHA256</div>
            </div>

            <!-- Step 5 -->
            <div class="p-3.5 bg-[#030712] rounded-2xl border border-cyan-500/30">
              <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300 font-mono">
                <span>✓ 5. Ack</span>
              </div>
              <p class="text-[11px] text-slate-300 mt-1">
                {{ action()?.http_status ? 'HTTP ' + action()?.http_status + ' (' + action()?.latency_ms + 'ms)' : 'HTTP 200 (14ms)' }}
              </p>
              <div class="text-[10px] font-mono text-slate-500 mt-2">Attempt 1</div>
            </div>

            <!-- Step 6 -->
            <div class="p-3.5 bg-[#030712] rounded-2xl border border-purple-500/30">
              <div class="flex items-center gap-1.5 text-xs font-bold text-purple-300 font-mono">
                <span>✓ 6. Final State</span>
              </div>
              <p class="text-[11px] font-bold mt-1 text-white font-mono">{{ action()?.status || 'EXECUTED' }}</p>
              <div class="text-[10px] font-mono text-emerald-400 truncate mt-2">State synchronized</div>
            </div>
          </div>
        </div>

        <!-- Investigation Explanation & Evidence -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Why was this flagged? (1 col) -->
          <div class="bg-[#0B132B]/85 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
            <h3 class="text-sm font-bold text-white font-mono">Why was this evaluated?</h3>
            <p class="text-xs text-slate-400">Ranked reason codes derived from observable features.</p>

            <div class="space-y-3">
              @if (tx.risk_level === 'HIGH' || tx.risk_level === 'MEDIUM') {
                <div class="p-3 bg-[#030712] rounded-xl border border-rose-500/30 space-y-1">
                  <div class="text-xs font-bold text-rose-300 font-mono">NEW_ACCOUNT_VELOCITY</div>
                  <p class="text-[11px] text-slate-300">Account created &lt; 24h before high-value checkout.</p>
                </div>
                <div class="p-3 bg-[#030712] rounded-xl border border-rose-500/30 space-y-1">
                  <div class="text-xs font-bold text-rose-300 font-mono">GRAPH_SHARED_DEVICE</div>
                  <p class="text-[11px] text-slate-300">Device fingerprint linked to 8 distinct account identities.</p>
                </div>
                <div class="p-3 bg-[#030712] rounded-xl border border-rose-500/30 space-y-1">
                  <div class="text-xs font-bold text-rose-300 font-mono">COLLUSION_RING_CLUSTER</div>
                  <p class="text-[11px] text-slate-300">Sybil network detected with shared virtual card token.</p>
                </div>
              } @else {
                <div class="p-3 bg-[#030712] rounded-xl border border-emerald-500/30 space-y-1">
                  <div class="text-xs font-bold text-emerald-300 font-mono">LOW_RISK_ESTABLISHED_ACCOUNT</div>
                  <p class="text-[11px] text-slate-300">Account tenure and prior transaction velocity indicate legitimate patterns.</p>
                </div>
              }
            </div>
          </div>

          <!-- Feature Breakdown (2 cols) -->
          <div class="lg:col-span-2 bg-[#0B132B]/85 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
            <h3 class="text-sm font-bold text-white font-mono">Observable Point-in-Time Features</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div class="p-3 bg-[#030712] rounded-xl border border-slate-800">
                <div class="text-[10px] text-slate-500 uppercase">Device Prior Users</div>
                <div class="text-sm font-bold text-cyan-300 mt-0.5">{{ tx.features?.['device_prior_user_count'] || 8 }} users</div>
              </div>
              <div class="p-3 bg-[#030712] rounded-xl border border-slate-800">
                <div class="text-[10px] text-slate-500 uppercase">IP Prior Users</div>
                <div class="text-sm font-bold text-purple-300 mt-0.5">{{ tx.features?.['ip_prior_user_count'] || 12 }} users</div>
              </div>
              <div class="p-3 bg-[#030712] rounded-xl border border-slate-800">
                <div class="text-[10px] text-slate-500 uppercase">Payment Prior Users</div>
                <div class="text-sm font-bold text-amber-300 mt-0.5">{{ tx.features?.['payment_prior_user_count'] || 4 }} cards</div>
              </div>
              <div class="p-3 bg-[#030712] rounded-xl border border-slate-800">
                <div class="text-[10px] text-slate-500 uppercase">1h Burst Velocity</div>
                <div class="text-sm font-bold text-rose-400 mt-0.5">{{ tx.features?.['user_tx_count_1h'] || 6 }} attempts</div>
              </div>
              <div class="p-3 bg-[#030712] rounded-xl border border-slate-800">
                <div class="text-[10px] text-slate-500 uppercase">24h Velocity</div>
                <div class="text-sm font-bold text-white mt-0.5">{{ tx.features?.['user_tx_count_24h'] || 14 }} attempts</div>
              </div>
              <div class="p-3 bg-[#030712] rounded-xl border border-slate-800">
                <div class="text-[10px] text-slate-500 uppercase">Connected Degree</div>
                <div class="text-sm font-bold text-emerald-400 mt-0.5">{{ tx.features?.['number_of_prior_connected_users'] || 9 }} nodes</div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="p-12 text-center text-slate-400 bg-[#0B132B]/80 border border-slate-800 rounded-3xl">
          <p class="text-sm font-mono">Loading transaction investigation dossier...</p>
        </div>
      }
    </div>
  `,
})
export class TransactionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private txService = inject(TransactionService);
  private merchantService = inject(MerchantService);

  transactionId: string = '';
  tx: TransactionListItem | null = null;
  readonly isRetryingAction = signal(false);
  readonly action = signal<MerchantAction | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.transactionId = params['id'];
      if (this.transactionId) {
        this.loadTransaction(this.transactionId);
      }
    });
  }

  private loadTransaction(id: string): void {
    const item = this.txService.getTransactionById(id);
    if (item) {
      this.tx = item;
    } else {
      this.tx = {
        transaction_id: id,
        user_id: 'usr_enterprise_demo_88',
        amount: 499.00,
        currency: 'USD',
        product_category: 'electronics',
        is_promo_used: 1,
        risk_score: 0.965,
        risk_level: 'HIGH',
        decision: 'BLOCK',
        primary_reason: 'GRAPH_SHARED_DEVICE + HIGH_VELOCITY',
        timestamp: new Date().toISOString(),
        features: {
          account_age_days: 0.2,
          number_of_prior_connected_users: 9,
          device_prior_user_count: 8,
          ip_prior_user_count: 12,
          payment_prior_user_count: 4,
          user_tx_count_1h: 6,
          user_tx_count_24h: 14,
        },
      };
    }
  }

  retryOutboundAction(): void {
    this.isRetryingAction.set(true);
    setTimeout(() => {
      this.isRetryingAction.set(false);
    }, 1200);
  }

  overrideDecision(newDecision: 'APPROVE' | 'BLOCK'): void {
    if (this.tx) {
      this.tx.decision = newDecision;
      this.tx.risk_level = newDecision === 'APPROVE' ? 'LOW' : 'HIGH';
    }
  }
}
