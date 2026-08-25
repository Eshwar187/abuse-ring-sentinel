import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { TransactionService } from '../../core/services/transaction.service';
import { MerchantService } from '../../core/services/merchant.service';
import { TransactionListItem } from '../../core/models/risk.models';
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
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Breadcrumb & Back -->
      <div class="flex items-center gap-2 text-xs text-surface-500 font-medium">
        <a routerLink="/transactions" class="hover:text-brand-600 hover:underline">Transactions</a>
        <span>/</span>
        <span class="font-mono text-surface-900">{{ transactionId }}</span>
      </div>

      @if (tx) {
        <!-- Top Status Card -->
        <div class="bg-white border border-surface-200 rounded-lg p-6 shadow-card">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-surface-200">
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-2xl font-bold font-mono text-surface-900 tracking-tight">{{ tx.transaction_id }}</h1>
                <app-risk-badge [level]="tx.risk_level"></app-risk-badge>
                <app-decision-badge [decision]="tx.decision"></app-decision-badge>
              </div>
              <p class="text-xs text-surface-500 mt-1.5 font-mono">
                Evaluated at {{ tx.timestamp | date:'medium' }} • User ID: <span class="text-surface-800 font-semibold">{{ tx.user_id }}</span>
              </p>
            </div>

            <!-- Operator Action Buttons -->
            <div class="flex items-center gap-2.5">
              <button
                (click)="overrideDecision('APPROVE')"
                class="px-3 py-1.5 bg-surface-50 hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold rounded text-xs transition-colors"
              >
                Approve Order
              </button>
              <button
                (click)="overrideDecision('REVIEW')"
                class="px-3 py-1.5 bg-surface-50 hover:bg-amber-50 text-amber-800 border border-amber-300 font-semibold rounded text-xs transition-colors"
              >
                Request 2FA
              </button>
              <button
                (click)="overrideDecision('BLOCK')"
                class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded text-xs transition-colors shadow-sm"
              >
                Confirm Block
              </button>
            </div>
          </div>

          <!-- Risk Score Breakdown Banner -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
            <div class="p-4 bg-surface-50 rounded-lg border border-surface-200">
              <div class="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Model Risk Score</div>
              <div class="text-2xl font-bold font-mono mt-1 text-surface-900">{{ (tx.risk_score * 100).toFixed(2) }}%</div>
              <div class="mt-2"><app-score-meter [score]="tx.risk_score"></app-score-meter></div>
            </div>

            <div class="p-4 bg-surface-50 rounded-lg border border-surface-200">
              <div class="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Order Value</div>
              <div class="text-2xl font-bold font-mono mt-1 text-surface-900">\${{ tx.amount.toFixed(2) }}</div>
              <div class="text-xs text-surface-500 mt-1 uppercase font-semibold">{{ tx.product_category }}</div>
            </div>

            <div class="p-4 bg-surface-50 rounded-lg border border-surface-200">
              <div class="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Prior Connected Users</div>
              <div class="text-2xl font-bold font-mono mt-1" [ngClass]="tx.connected_users! >= 2 ? 'text-rose-600' : 'text-emerald-700'">
                {{ tx.connected_users || 0 }} Accounts
              </div>
              <div class="text-xs text-surface-500 mt-1">Incremental Entity Subgraph</div>
            </div>

            <div class="p-4 bg-surface-50 rounded-lg border border-surface-200">
              <div class="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Policy Ruling</div>
              <div class="text-lg font-bold font-mono mt-1" [ngClass]="tx.decision === 'BLOCK' ? 'text-rose-600' : tx.decision === 'REVIEW' ? 'text-amber-700' : 'text-emerald-700'">
                {{ tx.decision }}
              </div>
              <div class="text-xs text-surface-500 mt-1">Threshold: tau = 0.90</div>
            </div>
          </div>
        </div>

        <!-- Investigation Explanation & Evidence -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Why was this flagged? (1 col) -->
          <div class="bg-white border border-surface-200 rounded-lg p-5 shadow-card">
            <h3 class="text-sm font-bold text-surface-900 mb-1">Why was this evaluated?</h3>
            <p class="text-xs text-surface-500 mb-4">Ranked human-readable reason codes derived from observable features.</p>

            <div class="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-surface-200">
              @if (tx.risk_level === 'HIGH' || tx.risk_level === 'MEDIUM') {
                <div class="relative flex items-start gap-3 pl-1">
                  <div class="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold font-mono z-10">
                    01
                  </div>
                  <div class="flex-1 bg-surface-50 p-3 rounded-lg border border-surface-200">
                    <div class="text-xs font-bold text-surface-900 font-mono">NEW_ACCOUNT</div>
                    <p class="text-[11px] text-surface-600 mt-1">Account was created < 24 hours before order.</p>
                    <div class="mt-2 text-[10px] font-mono bg-white p-1.5 rounded border border-surface-200 text-surface-700">
                      account_age_days: <span class="font-bold text-rose-600">{{ tx.features?.['account_age_days'] }} days</span>
                    </div>
                  </div>
                </div>

                <div class="relative flex items-start gap-3 pl-1">
                  <div class="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold font-mono z-10">
                    02
                  </div>
                  <div class="flex-1 bg-surface-50 p-3 rounded-lg border border-surface-200">
                    <div class="text-xs font-bold text-surface-900 font-mono">GRAPH_CONNECTED_USERS</div>
                    <p class="text-[11px] text-surface-600 mt-1">Transaction links to a dense multi-account cluster.</p>
                    <div class="mt-2 text-[10px] font-mono bg-white p-1.5 rounded border border-surface-200 text-surface-700">
                      connected_users: <span class="font-bold text-rose-600">{{ tx.features?.['number_of_prior_connected_users'] }} accounts</span>
                    </div>
                  </div>
                </div>

                <div class="relative flex items-start gap-3 pl-1">
                  <div class="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold font-mono z-10">
                    03
                  </div>
                  <div class="flex-1 bg-surface-50 p-3 rounded-lg border border-surface-200">
                    <div class="text-xs font-bold text-surface-900 font-mono">GRAPH_SHARED_DEVICE</div>
                    <p class="text-[11px] text-surface-600 mt-1">Device fingerprint associated with multiple user identities.</p>
                    <div class="mt-2 text-[10px] font-mono bg-white p-1.5 rounded border border-surface-200 text-surface-700">
                      device_prior_user_count: <span class="font-bold text-rose-600">{{ tx.features?.['device_prior_user_count'] }} users</span>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="relative flex items-start gap-3 pl-1">
                  <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold font-mono z-10">
                    01
                  </div>
                  <div class="flex-1 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <div class="text-xs font-bold text-emerald-900 font-mono">LOW_RISK_ESTABLISHED_ACCOUNT</div>
                    <p class="text-[11px] text-emerald-800 mt-1">
                      Account tenure and prior transaction velocity indicate legitimate consumer patterns.
                    </p>
                    <div class="mt-2 text-[10px] font-mono bg-white p-1.5 rounded border border-emerald-200 text-emerald-700">
                      account_age_days: <span class="font-bold">{{ tx.features?.['account_age_days'] }} days</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Feature Evidence Groups (2 cols) -->
          <div class="lg:col-span-2 space-y-4">
            <!-- Account & Profile Features -->
            <div class="bg-white border border-surface-200 rounded-lg p-5 shadow-card">
              <h3 class="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">1. Account & Identity Evidence</h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div class="p-2.5 bg-surface-50 rounded border border-surface-200">
                  <div class="text-[10px] text-surface-400 font-semibold">Account Age</div>
                  <div class="font-mono font-bold text-surface-900 mt-0.5">{{ tx.features?.['account_age_days'] }} days</div>
                </div>
                <div class="p-2.5 bg-surface-50 rounded border border-surface-200">
                  <div class="text-[10px] text-surface-400 font-semibold">Email Domain</div>
                  <div class="font-mono font-bold text-surface-900 mt-0.5">{{ tx.features?.['email_domain'] }}</div>
                </div>
                <div class="p-2.5 bg-surface-50 rounded border border-surface-200">
                  <div class="text-[10px] text-surface-400 font-semibold">Historical Tx Count</div>
                  <div class="font-mono font-bold text-surface-900 mt-0.5">{{ tx.features?.['user_historical_tx_count'] }}</div>
                </div>
                <div class="p-2.5 bg-surface-50 rounded border border-surface-200">
                  <div class="text-[10px] text-surface-400 font-semibold">Historical Avg Amount</div>
                  <div class="font-mono font-bold text-surface-900 mt-0.5">\${{ tx.features?.['user_historical_mean_amount']?.toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <!-- Behavioral Velocity -->
            <div class="bg-white border border-surface-200 rounded-lg p-5 shadow-card">
              <h3 class="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">2. Point-in-Time Velocity Windows</h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div class="p-2.5 bg-surface-50 rounded border border-surface-200">
                  <div class="text-[10px] text-surface-400 font-semibold">1-Hour Tx Velocity</div>
                  <div class="font-mono font-bold text-surface-900 mt-0.5">{{ tx.features?.['user_tx_count_1h'] }} tx</div>
                </div>
                <div class="p-2.5 bg-surface-50 rounded border border-surface-200">
                  <div class="text-[10px] text-surface-400 font-semibold">24-Hour Tx Velocity</div>
                  <div class="font-mono font-bold text-surface-900 mt-0.5">{{ tx.features?.['user_tx_count_24h'] }} tx</div>
                </div>
                <div class="p-2.5 bg-surface-50 rounded border border-surface-200">
                  <div class="text-[10px] text-surface-400 font-semibold">7-Day Tx Velocity</div>
                  <div class="font-mono font-bold text-surface-900 mt-0.5">{{ tx.features?.['user_tx_count_7d'] }} tx</div>
                </div>
                <div class="p-2.5 bg-surface-50 rounded border border-surface-200">
                  <div class="text-[10px] text-surface-400 font-semibold">Promo Voucher Usage</div>
                  <div class="font-mono font-bold text-surface-900 mt-0.5">{{ tx.features?.['is_promo_used'] ? 'YES' : 'NO' }}</div>
                </div>
              </div>
            </div>

            <!-- Graph Entity Collusion -->
            <div class="bg-white border border-surface-200 rounded-lg p-5 shadow-card">
              <h3 class="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">3. Heterogeneous Entity Graph Signals</h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div class="p-2.5 bg-surface-50 rounded border border-surface-200">
                  <div class="text-[10px] text-surface-400 font-semibold">Device Shared Users</div>
                  <div class="font-mono font-bold text-surface-900 mt-0.5">{{ tx.features?.['device_prior_user_count'] }} accounts</div>
                </div>
                <div class="p-2.5 bg-surface-50 rounded border border-surface-200">
                  <div class="text-[10px] text-surface-400 font-semibold">IP Shared Users</div>
                  <div class="font-mono font-bold text-surface-900 mt-0.5">{{ tx.features?.['ip_prior_user_count'] }} accounts</div>
                </div>
                <div class="p-2.5 bg-surface-50 rounded border border-surface-200">
                  <div class="text-[10px] text-surface-400 font-semibold">Payment Shared Users</div>
                  <div class="font-mono font-bold text-surface-900 mt-0.5">{{ tx.features?.['payment_prior_user_count'] }} accounts</div>
                </div>
                <div class="p-2.5 bg-surface-50 rounded border border-surface-200">
                  <div class="text-[10px] text-surface-400 font-semibold">Address Shared Users</div>
                  <div class="font-mono font-bold text-surface-900 mt-0.5">{{ tx.features?.['shipping_address_prior_user_count'] }} accounts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="bg-white border border-surface-200 rounded-lg p-8 text-center text-surface-500">
          <p class="text-sm font-semibold">Transaction not found</p>
          <p class="text-xs text-surface-400 mt-1">Transaction ID: {{ transactionId }}</p>
          <a routerLink="/app/transactions" class="inline-block mt-4 text-xs text-brand-600 font-semibold hover:underline">
            ← Return to live transactions list
          </a>
        </div>
      }
    </div>
  `,
})
export class TransactionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private txService = inject(TransactionService);
  private merchantService = inject(MerchantService);

  transactionId = '';
  tx?: TransactionListItem;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.transactionId = params['id'];
      const demoTx = this.txService.getTransactionById(this.transactionId);
      if (demoTx) {
        this.tx = demoTx;
      } else {
        this.merchantService.getTransactionDetail(this.transactionId).subscribe({
          next: (res) => {
            this.tx = {
              transaction_id: res.transaction_id,
              timestamp: res.timestamp,
              amount: res.amount,
              currency: res.currency,
              product_category: res.product_category,
              risk_score: res.risk_score,
              risk_level: res.risk_level,
              decision: res.decision,
              primary_reason: res.decision,
              user_id: res.user_id,
              is_promo_used: res.is_promo_used,
              connected_users: 1,
            };
          },
          error: () => {
            this.tx = undefined;
          },
        });
      }
    });
  }

  overrideDecision(action: string) {
    alert(`Operator override logged: Transaction ${this.transactionId} updated to ${action}. Audit trail recorded.`);
  }
}

