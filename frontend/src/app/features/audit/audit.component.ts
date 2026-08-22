import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TransactionService } from '../../core/services/transaction.service';
import { RiskService } from '../../core/services/risk.service';
import { AuditRecord, RiskDecision } from '../../core/models/risk.models';
import { DecisionBadgeComponent } from '../../shared/components/decision-badge.component';
import { ScoreMeterComponent } from '../../shared/components/score-meter.component';
import { RiskBadgeComponent } from '../../shared/components/risk-badge.component';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecisionBadgeComponent,
    ScoreMeterComponent,
    RiskBadgeComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-surface-900 tracking-tight">Audit & Compliance Log</h2>
          <p class="text-xs text-surface-500 mt-1">
            Immutable regulatory audit trail recording model predictions, policy decisions, and reason codes without sensitive PII.
          </p>
        </div>
        <div class="text-xs font-mono text-surface-500 bg-white px-3 py-1.5 border border-surface-200 rounded-md shadow-sm">
          Logged Events: <span class="font-bold text-surface-900">{{ filteredLogs.length }}</span>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="bg-white border border-surface-200 rounded-lg p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex-1 max-w-md">
          <input
            type="text"
            [(ngModel)]="searchFilter"
            (input)="applyFilters()"
            placeholder="Search transaction ID in audit log..."
            class="w-full px-3 py-1.5 text-xs bg-surface-50 border border-surface-200 rounded font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs text-surface-500 font-semibold">Filter Decision:</label>
          <select
            [(ngModel)]="decisionFilter"
            (change)="applyFilters()"
            class="px-3 py-1.5 text-xs bg-surface-50 border border-surface-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">All Decisions</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REVIEW">REVIEW</option>
            <option value="BLOCK">BLOCK</option>
          </select>
        </div>
      </div>

      <!-- Audit Log Table & Drawer Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Audit Table (8 cols or 12 cols if no selection) -->
        <div [ngClass]="selectedRecord ? 'lg:col-span-8' : 'lg:col-span-12'" class="bg-white border border-surface-200 rounded-lg shadow-card overflow-hidden transition-all duration-200">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-surface-50 border-b border-surface-200 text-surface-500 font-bold uppercase tracking-wider text-[10px]">
                  <th class="py-3 px-4 font-semibold">Timestamp (UTC)</th>
                  <th class="py-3 px-4 font-semibold">Transaction ID</th>
                  <th class="py-3 px-4 font-semibold">Risk Score</th>
                  <th class="py-3 px-4 font-semibold">Decision</th>
                  <th class="py-3 px-4 font-semibold">Logged Reasons</th>
                  <th class="py-3 px-4 font-semibold">Model / Policy</th>
                  <th class="py-3 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-100 font-mono">
                @for (log of filteredLogs; track log.transaction_id) {
                  <tr
                    (click)="selectRecord(log)"
                    class="hover:bg-surface-50 cursor-pointer transition-colors"
                    [ngClass]="selectedRecord?.transaction_id === log.transaction_id ? 'bg-brand-50/50' : ''"
                  >
                    <td class="py-3 px-4 text-surface-500 text-[11px] whitespace-nowrap">
                      {{ log.timestamp | date:'yyyy-MM-dd HH:mm:ss' }}
                    </td>
                    <td class="py-3 px-4 font-bold text-surface-900">
                      {{ log.transaction_id }}
                    </td>
                    <td class="py-3 px-4 font-sans">
                      <app-score-meter [score]="log.risk_score"></app-score-meter>
                    </td>
                    <td class="py-3 px-4 font-sans">
                      <app-decision-badge [decision]="log.decision"></app-decision-badge>
                    </td>
                    <td class="py-3 px-4 text-surface-700 text-[11px] max-w-[200px] truncate" [title]="log.reason_codes.join(', ')">
                      {{ log.reason_codes.join(', ') }}
                    </td>
                    <td class="py-3 px-4 text-[10px] text-surface-400">
                      {{ log.model_version }} / {{ log.policy_version }}
                    </td>
                    <td class="py-3 px-4 text-right font-sans">
                      <button
                        (click)="selectRecord(log); $event.stopPropagation()"
                        class="px-2 py-1 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded text-[11px] font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="py-8 text-center text-surface-400 text-xs font-sans">
                      No audit records match the selected criteria.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Detail Side Drawer (4 cols when active) -->
        @if (selectedRecord) {
          <div class="lg:col-span-4 bg-white border border-surface-200 rounded-lg p-5 shadow-card space-y-4 animate-in fade-in duration-200">
            <div class="flex items-center justify-between pb-3 border-b border-surface-200">
              <div>
                <div class="text-[10px] font-bold text-surface-400 uppercase">Audit Record Inspector</div>
                <h3 class="text-sm font-bold font-mono text-surface-900 mt-0.5">{{ selectedRecord.transaction_id }}</h3>
              </div>
              <button
                (click)="selectedRecord = null"
                class="w-6 h-6 rounded bg-surface-100 hover:bg-surface-200 text-surface-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div class="space-y-2 text-xs font-mono">
              <div class="flex justify-between py-1 border-b border-surface-100">
                <span class="text-surface-500 font-sans">Evaluation Timestamp:</span>
                <span class="text-surface-800">{{ selectedRecord.timestamp }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-surface-100">
                <span class="text-surface-500 font-sans">Risk Score:</span>
                <span class="font-bold text-surface-900">{{ (selectedRecord.risk_score * 100).toFixed(4) }}%</span>
              </div>
              <div class="flex justify-between py-1 border-b border-surface-100">
                <span class="text-surface-500 font-sans">Risk Level:</span>
                <app-risk-badge [level]="selectedRecord.risk_level"></app-risk-badge>
              </div>
              <div class="flex justify-between py-1 border-b border-surface-100">
                <span class="text-surface-500 font-sans">Policy Decision:</span>
                <app-decision-badge [decision]="selectedRecord.decision"></app-decision-badge>
              </div>
              <div class="flex justify-between py-1 border-b border-surface-100">
                <span class="text-surface-500 font-sans">Model Version:</span>
                <span class="text-surface-700">{{ selectedRecord.model_version }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-surface-100">
                <span class="text-surface-500 font-sans">Policy Version:</span>
                <span class="text-surface-700">{{ selectedRecord.policy_version }}</span>
              </div>
            </div>

            <div>
              <h4 class="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-2">Audit Reason Codes</h4>
              <div class="space-y-1.5 font-mono text-xs">
                @for (code of selectedRecord.reason_codes; track code) {
                  <div class="p-2 bg-surface-50 rounded border border-surface-200 text-surface-800 font-semibold">
                    {{ code }}
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AuditComponent implements OnInit {
  private txService = inject(TransactionService);
  private riskService = inject(RiskService);

  allLogs: AuditRecord[] = [];
  filteredLogs: AuditRecord[] = [];
  selectedRecord: AuditRecord | null = null;

  searchFilter = '';
  decisionFilter: 'ALL' | RiskDecision = 'ALL';

  ngOnInit(): void {
    const historical = this.txService.getAuditLogs();
    const session = this.riskService.sessionAuditLog();
    this.allLogs = [...session, ...historical];
    this.filteredLogs = [...this.allLogs];
  }

  selectRecord(record: AuditRecord) {
    this.selectedRecord = record;
  }

  applyFilters() {
    this.filteredLogs = this.allLogs.filter((log) => {
      const matchSearch =
        !this.searchFilter.trim() ||
        log.transaction_id.toLowerCase().includes(this.searchFilter.toLowerCase());

      const matchDecision = this.decisionFilter === 'ALL' || log.decision === this.decisionFilter;

      return matchSearch && matchDecision;
    });
  }
}
