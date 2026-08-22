import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { TransactionService } from '../../core/services/transaction.service';
import { TransactionListItem, RiskLevel, RiskDecision } from '../../core/models/risk.models';
import { RiskBadgeComponent } from '../../shared/components/risk-badge.component';
import { DecisionBadgeComponent } from '../../shared/components/decision-badge.component';
import { ScoreMeterComponent } from '../../shared/components/score-meter.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RiskBadgeComponent,
    DecisionBadgeComponent,
    ScoreMeterComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-surface-900 tracking-tight">Transactions Console</h2>
          <p class="text-xs text-surface-500 mt-1">
            Real-time audit and investigation queue for evaluated merchant transactions.
          </p>
        </div>
        <div class="text-xs font-mono text-surface-500 bg-white px-3 py-1.5 border border-surface-200 rounded-md shadow-sm">
          Total in View: <span class="font-bold text-surface-900">{{ filteredTransactions.length }}</span> records
        </div>
      </div>

      <!-- Filters & Toolbar -->
      <div class="bg-white border border-surface-200 rounded-lg p-4 shadow-card space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Search -->
          <div>
            <label class="block text-[11px] font-bold text-surface-500 uppercase tracking-wider mb-1">Search ID / User</label>
            <input
              type="text"
              [(ngModel)]="searchFilter"
              (input)="applyFilters()"
              placeholder="e.g. tx_0027436 or usr_004812"
              class="w-full px-3 py-1.5 text-xs bg-surface-50 border border-surface-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
            />
          </div>

          <!-- Risk Level Filter -->
          <div>
            <label class="block text-[11px] font-bold text-surface-500 uppercase tracking-wider mb-1">Risk Level</label>
            <select
              [(ngModel)]="riskFilter"
              (change)="applyFilters()"
              class="w-full px-3 py-1.5 text-xs bg-surface-50 border border-surface-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Levels</option>
              <option value="LOW">Low Risk (<0.50)</option>
              <option value="MEDIUM">Medium Risk (0.50 - 0.90)</option>
              <option value="HIGH">High Risk (≥0.90)</option>
            </select>
          </div>

          <!-- Decision Filter -->
          <div>
            <label class="block text-[11px] font-bold text-surface-500 uppercase tracking-wider mb-1">Decision</label>
            <select
              [(ngModel)]="decisionFilter"
              (change)="applyFilters()"
              class="w-full px-3 py-1.5 text-xs bg-surface-50 border border-surface-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Decisions</option>
              <option value="APPROVE">APPROVE (Auto)</option>
              <option value="REVIEW">REVIEW (2FA / Step-up)</option>
              <option value="BLOCK">BLOCK (Declined)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Transactions Data Table -->
      <div class="bg-white border border-surface-200 rounded-lg shadow-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-surface-50 border-b border-surface-200 text-surface-500 font-bold uppercase tracking-wider text-[10px]">
                <th class="py-3 px-4 font-semibold">Transaction ID</th>
                <th class="py-3 px-4 font-semibold">Timestamp</th>
                <th class="py-3 px-4 font-semibold">User / Category</th>
                <th class="py-3 px-4 font-semibold">Amount</th>
                <th class="py-3 px-4 font-semibold">Risk Score</th>
                <th class="py-3 px-4 font-semibold">Risk Level</th>
                <th class="py-3 px-4 font-semibold">Decision</th>
                <th class="py-3 px-4 font-semibold">Primary Reason / Trigger</th>
                <th class="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 font-sans">
              @for (tx of filteredTransactions; track tx.transaction_id) {
                <tr class="hover:bg-surface-50 transition-colors">
                  <td class="py-3.5 px-4 font-mono font-bold text-surface-900">
                    <a [routerLink]="['/transactions', tx.transaction_id]" class="hover:text-brand-600 hover:underline">
                      {{ tx.transaction_id }}
                    </a>
                  </td>
                  <td class="py-3.5 px-4 font-mono text-surface-500 text-[11px] whitespace-nowrap">
                    {{ tx.timestamp | date:'mediumDate' }} {{ tx.timestamp | date:'shortTime' }}
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="font-mono text-surface-800 text-[11px]">{{ tx.user_id || 'usr_unknown' }}</div>
                    <div class="text-[10px] text-surface-400 uppercase font-semibold">{{ tx.product_category }}</div>
                  </td>
                  <td class="py-3.5 px-4 font-mono font-bold text-surface-900 whitespace-nowrap">
                    \${{ tx.amount.toFixed(2) }}
                  </td>
                  <td class="py-3.5 px-4">
                    <app-score-meter [score]="tx.risk_score"></app-score-meter>
                  </td>
                  <td class="py-3.5 px-4">
                    <app-risk-badge [level]="tx.risk_level"></app-risk-badge>
                  </td>
                  <td class="py-3.5 px-4">
                    <app-decision-badge [decision]="tx.decision"></app-decision-badge>
                  </td>
                  <td class="py-3.5 px-4 font-medium text-surface-700 max-w-[220px] truncate" [title]="tx.primary_reason">
                    {{ tx.primary_reason }}
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <a
                      [routerLink]="['/transactions', tx.transaction_id]"
                      class="px-2.5 py-1 bg-surface-100 hover:bg-surface-200 text-surface-800 font-semibold rounded text-xs transition-colors"
                    >
                      Investigate
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="py-8 text-center text-surface-400 text-xs">
                    No transactions match the selected filter criteria.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class TransactionsComponent implements OnInit {
  private txService = inject(TransactionService);
  private route = inject(ActivatedRoute);

  transactions: TransactionListItem[] = [];
  filteredTransactions: TransactionListItem[] = [];

  searchFilter = '';
  riskFilter: 'ALL' | RiskLevel = 'ALL';
  decisionFilter: 'ALL' | RiskDecision = 'ALL';

  ngOnInit(): void {
    this.transactions = this.txService.getTransactions();
    this.filteredTransactions = [...this.transactions];

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.searchFilter = params['id'];
        this.applyFilters();
      }
    });
  }

  applyFilters() {
    this.filteredTransactions = this.transactions.filter((tx) => {
      const matchSearch =
        !this.searchFilter.trim() ||
        tx.transaction_id.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        (tx.user_id && tx.user_id.toLowerCase().includes(this.searchFilter.toLowerCase()));

      const matchRisk = this.riskFilter === 'ALL' || tx.risk_level === this.riskFilter;
      const matchDecision = this.decisionFilter === 'ALL' || tx.decision === this.decisionFilter;

      return matchSearch && matchRisk && matchDecision;
    });
  }
}
