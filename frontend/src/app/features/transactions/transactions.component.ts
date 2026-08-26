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
    <div class="space-y-6 max-w-7xl mx-auto font-sans select-none pb-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold rounded-full font-mono uppercase">
              TRANSACTION LEDGER
            </span>
          </div>
          <h2 class="text-2xl font-extrabold text-white tracking-tight mt-1.5">Transactions Console</h2>
          <p class="text-xs text-slate-400 mt-1">
            Real-time audit and investigation queue for evaluated merchant transactions in Cloud MySQL.
          </p>
        </div>
        <div class="text-xs font-mono text-cyan-300 bg-[#0B132B] px-3.5 py-2 border border-slate-800 rounded-xl shadow-sm">
          Total in View: <span class="font-bold text-white">{{ filteredTransactions.length }}</span> records
        </div>
      </div>

      <!-- Filters & Toolbar -->
      <div class="bg-[#0B132B]/85 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 backdrop-blur-xl">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Search ID / User</label>
            <input
              type="text"
              [(ngModel)]="searchFilter"
              (input)="applyFilters()"
              placeholder="e.g. tx_0027436 or usr_004812"
              class="w-full px-4 py-2 text-xs bg-[#030712] border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 font-mono text-cyan-300 placeholder-slate-500 shadow-inner"
            />
          </div>

          <!-- Risk Level Filter -->
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Risk Level</label>
            <select
              [(ngModel)]="riskFilter"
              (change)="applyFilters()"
              class="w-full px-3 py-2 text-xs bg-[#030712] border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-200"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="LOW">LOW Risk (Score &lt; 0.40)</option>
              <option value="MEDIUM">MEDIUM Risk (0.40 - 0.90)</option>
              <option value="HIGH">HIGH Risk (Score &ge; 0.90)</option>
            </select>
          </div>

          <!-- Decision Filter -->
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Policy Decision</label>
            <select
              [(ngModel)]="decisionFilter"
              (change)="applyFilters()"
              class="w-full px-3 py-2 text-xs bg-[#030712] border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-200"
            >
              <option value="ALL">All Decisions</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REVIEW">REVIEW</option>
              <option value="BLOCK">BLOCK</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="bg-[#0B132B]/85 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-[#030712] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                <th class="py-3.5 px-4 font-semibold">Transaction ID</th>
                <th class="py-3.5 px-4 font-semibold">User ID</th>
                <th class="py-3.5 px-4 font-semibold">Amount</th>
                <th class="py-3.5 px-4 font-semibold">Category</th>
                <th class="py-3.5 px-4 font-semibold">Risk Score</th>
                <th class="py-3.5 px-4 font-semibold">Risk Tier</th>
                <th class="py-3.5 px-4 font-semibold">Decision</th>
                <th class="py-3.5 px-4 font-semibold">Timestamp</th>
                <th class="py-3.5 px-4 text-right font-semibold">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono">
              @for (tx of pagedTransactions; track tx.transaction_id) {
                <tr class="hover:bg-slate-900/60 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-cyan-300">
                    <a [routerLink]="['/app/transactions', tx.transaction_id]" class="hover:underline">
                      {{ tx.transaction_id }}
                    </a>
                  </td>
                  <td class="py-3.5 px-4 text-slate-400">
                    {{ tx.user_id }}
                  </td>
                  <td class="py-3.5 px-4 font-bold text-slate-100">
                    \${{ tx.amount.toFixed(2) }}
                  </td>
                  <td class="py-3.5 px-4 text-slate-400 uppercase text-[10px]">
                    {{ tx.product_category }}
                  </td>
                  <td class="py-3.5 px-4 font-sans">
                    <app-score-meter [score]="tx.risk_score"></app-score-meter>
                  </td>
                  <td class="py-3.5 px-4 font-sans">
                    <app-risk-badge [level]="tx.risk_level"></app-risk-badge>
                  </td>
                  <td class="py-3.5 px-4 font-sans">
                    <app-decision-badge [decision]="tx.decision"></app-decision-badge>
                  </td>
                  <td class="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                    {{ tx.timestamp | date:'yyyy-MM-dd HH:mm' }}
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <a
                      [routerLink]="['/app/transactions', tx.transaction_id]"
                      class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-mono text-cyan-300 hover:text-cyan-200 transition-colors"
                    >
                      Inspect →
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div class="px-6 py-4 border-t border-slate-800 bg-[#030712] flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Showing <strong class="text-white">{{ (currentPage - 1) * pageSize + 1 }}</strong> to <strong class="text-white">{{ Math.min(currentPage * pageSize, filteredTransactions.length) }}</strong> of <strong class="text-white">{{ filteredTransactions.length }}</strong>
          </div>
          <div class="flex items-center gap-2">
            <button
              (click)="goToPage(currentPage - 1)"
              [disabled]="currentPage === 1"
              class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-slate-200 transition-colors"
            >
              Prev
            </button>
            <span class="text-slate-500">Page {{ currentPage }} of {{ totalPages }}</span>
            <button
              (click)="goToPage(currentPage + 1)"
              [disabled]="currentPage >= totalPages"
              class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-slate-200 transition-colors"
            >
              Next
            </button>
          </div>
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
  pagedTransactions: TransactionListItem[] = [];

  searchFilter = '';
  riskFilter: string = 'ALL';
  decisionFilter: string = 'ALL';

  currentPage = 1;
  pageSize = 15;
  totalPages = 1;
  Math = Math;

  ngOnInit(): void {
    this.txService.getTransactions().subscribe({
      next: (data) => {
        this.transactions = data;
        this.route.queryParams.subscribe((params) => {
          if (params['risk']) this.riskFilter = params['risk'];
          if (params['decision']) this.decisionFilter = params['decision'];
          this.applyFilters();
        });
      },
    });
  }

  applyFilters(): void {
    let list = [...this.transactions];

    if (this.searchFilter.trim()) {
      const q = this.searchFilter.toLowerCase().trim();
      list = list.filter((t) =>
        t.transaction_id.toLowerCase().includes(q) ||
        t.user_id.toLowerCase().includes(q)
      );
    }

    if (this.riskFilter !== 'ALL') {
      list = list.filter((t) => t.risk_level === this.riskFilter);
    }

    if (this.decisionFilter !== 'ALL') {
      list = list.filter((t) => t.decision === this.decisionFilter);
    }

    this.filteredTransactions = list;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize) || 1;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.pagedTransactions = this.filteredTransactions.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }
}
