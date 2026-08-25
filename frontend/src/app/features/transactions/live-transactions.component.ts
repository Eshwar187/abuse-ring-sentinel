import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  Inbox,
  Zap,
} from 'lucide-angular';

import { DecisionBadgeComponent } from '../../shared/components/decision-badge.component';
import { MerchantService } from '../../core/services/merchant.service';
import { TransactionListItem } from '../../core/models/risk.models';

@Component({
  selector: 'app-live-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, DecisionBadgeComponent],
  template: `
    <div class="space-y-6 font-sans">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight">Live Merchant Transactions</h2>
          <p class="text-xs text-slate-400 mt-1">
            Real-time query of transactions evaluated by your merchant's isolated runtime engine.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="loadTransactions()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <lucide-icon name="refresh-cw" [size]="12"></lucide-icon>
            <span>Refresh</span>
          </button>

          <a
            routerLink="/app/risk-analyzer"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all"
          >
            <lucide-icon name="zap" [size]="13"></lucide-icon>
            <span>New Live Evaluation</span>
          </a>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <!-- Search Input -->
        <div class="relative flex-1 w-full">
          <lucide-icon name="search" [size]="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onFilterChange()"
            placeholder="Search by transaction ID, user ID, promo code, or email domain..."
            class="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
          />
        </div>

        <!-- Risk Level Filter -->
        <select
          [(ngModel)]="selectedRiskLevel"
          (ngModelChange)="onFilterChange()"
          class="w-full sm:w-40 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
        >
          <option value="">All Risk Levels</option>
          <option value="LOW">Low Risk (&lt;0.50)</option>
          <option value="MEDIUM">Medium Risk (0.50-0.89)</option>
          <option value="HIGH">High Risk (≥0.90)</option>
        </select>

        <!-- Decision Filter -->
        <select
          [(ngModel)]="selectedDecision"
          (ngModelChange)="onFilterChange()"
          class="w-full sm:w-40 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
        >
          <option value="">All Decisions</option>
          <option value="APPROVE">APPROVE</option>
          <option value="REVIEW">REVIEW</option>
          <option value="BLOCK">BLOCK</option>
        </select>
      </div>

      <!-- ZERO DATA STATE (0 Transactions) -->
      <div *ngIf="isZeroData() && !isLoading()" class="bg-slate-900 border border-indigo-500/30 rounded-2xl p-10 text-center space-y-4 shadow-xl">
        <div class="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <lucide-icon name="inbox" [size]="28"></lucide-icon>
        </div>
        <div class="max-w-md mx-auto">
          <h3 class="text-base font-bold text-white">No Live Transactions Found</h3>
          <p class="text-xs text-slate-400 mt-1">
            There are no recorded transactions matching your search criteria. Submit events via API to view them here in real time.
          </p>
        </div>
        <div class="pt-2">
          <a
            routerLink="/app/risk-analyzer"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all"
          >
            <lucide-icon name="zap" [size]="14"></lucide-icon>
            <span>Run Test Evaluation in Studio</span>
          </a>
        </div>
      </div>

      <!-- TRANSACTIONS TABLE -->
      <div *ngIf="!isZeroData() || isLoading()" class="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th class="px-4 py-3">Transaction ID</th>
                <th class="px-4 py-3">User ID</th>
                <th class="px-4 py-3">Amount</th>
                <th class="px-4 py-3">Category</th>
                <th class="px-4 py-3">Risk Score</th>
                <th class="px-4 py-3">Decision</th>
                <th class="px-4 py-3">Timestamp</th>
                <th class="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 font-mono">
              <tr *ngFor="let tx of transactions()" class="hover:bg-slate-800/50 transition-colors">
                <td class="px-4 py-3 font-bold text-slate-200">
                  <a [routerLink]="['/app/transactions', tx.transaction_id]" class="hover:text-rose-400">
                    {{ tx.transaction_id }}
                  </a>
                </td>
                <td class="px-4 py-3 text-slate-300">{{ tx.user_id }}</td>
                <td class="px-4 py-3 text-slate-200">
                  {{ tx.currency || 'INR' }} {{ (tx.amount || 0).toFixed(2) }}
                </td>
                <td class="px-4 py-3 font-sans text-slate-400 capitalize">
                  {{ tx.product_category || 'General' }}
                </td>
                <td class="px-4 py-3 font-bold" [ngClass]="{
                  'text-rose-400': (tx.risk_score || 0) >= 0.90,
                  'text-amber-400': (tx.risk_score || 0) >= 0.50 && (tx.risk_score || 0) < 0.90,
                  'text-emerald-400': (tx.risk_score || 0) < 0.50
                }">
                  {{ ((tx.risk_score || 0) * 100).toFixed(2) }}%
                </td>
                <td class="px-4 py-3">
                  <app-decision-badge [decision]="tx.decision || 'APPROVE'"></app-decision-badge>
                </td>
                <td class="px-4 py-3 text-slate-400 font-sans text-[11px]">
                  {{ tx.timestamp | date:'short' }}
                </td>
                <td class="px-4 py-3 text-right">
                  <a
                    [routerLink]="['/app/transactions', tx.transaction_id]"
                    class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    <span>View</span>
                    <lucide-icon name="arrow-right" [size]="10"></lucide-icon>
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Footer Pagination -->
        <div class="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            Total Records: <strong class="text-white">{{ totalCount() }}</strong>
          </div>
          <div class="flex items-center gap-2">
            <button
              [disabled]="currentPage() === 1"
              (click)="changePage(currentPage() - 1)"
              class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              Previous
            </button>
            <span>Page {{ currentPage() }}</span>
            <button
              [disabled]="transactions().length < pageSize"
              (click)="changePage(currentPage() + 1)"
              class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LiveTransactionsComponent implements OnInit {
  private merchantService = inject(MerchantService);

  readonly transactions = signal<TransactionListItem[]>([]);
  readonly totalCount = signal(0);
  readonly isZeroData = signal(true);
  readonly isLoading = signal(false);

  searchQuery = '';
  selectedRiskLevel = '';
  selectedDecision = '';
  currentPage = signal(1);
  pageSize = 50;

  ngOnInit() {
    this.loadTransactions();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadTransactions();
  }

  changePage(newPage: number) {
    if (newPage >= 1) {
      this.currentPage.set(newPage);
      this.loadTransactions();
    }
  }

  loadTransactions() {
    this.isLoading.set(true);
    this.merchantService.getLiveTransactions(
      this.searchQuery,
      this.selectedRiskLevel,
      this.selectedDecision,
      this.currentPage(),
      this.pageSize
    ).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.transactions.set(res.transactions);
        this.totalCount.set(res.total_count);
        this.isZeroData.set(res.zero_data_state);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
