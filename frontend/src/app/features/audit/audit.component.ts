import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TransactionService } from '../../core/services/transaction.service';
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
  ],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto font-sans select-none pb-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold rounded-full font-mono uppercase">
              IMMUTABLE AUDIT TRAIL
            </span>
          </div>
          <h2 class="text-2xl font-extrabold text-white tracking-tight mt-1.5">Audit & Compliance Log</h2>
          <p class="text-xs text-slate-400 mt-1">
            Immutable regulatory audit trail recording model predictions, policy decisions, and reason codes without sensitive PII.
          </p>
        </div>
        <div class="text-xs font-mono text-cyan-300 bg-[#0B132B] px-3.5 py-2 border border-slate-800 rounded-xl shadow-sm">
          Logged Events: <span class="font-bold text-white">{{ filteredLogs.length }}</span>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="bg-[#0B132B]/85 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-xl">
        <div class="flex-1 max-w-md">
          <input
            type="text"
            [(ngModel)]="searchFilter"
            (input)="applyFilters()"
            placeholder="Search transaction ID in audit log..."
            class="w-full px-4 py-2 text-xs bg-[#030712] border border-slate-800 rounded-xl font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
          />
        </div>
        <div class="flex items-center gap-2 text-xs font-mono">
          <label class="text-slate-400 font-semibold">Filter Decision:</label>
          <select
            [(ngModel)]="decisionFilter"
            (change)="applyFilters()"
            class="px-3 py-2 bg-[#030712] border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
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
        <div [ngClass]="selectedRecord ? 'lg:col-span-8' : 'lg:col-span-12'" class="bg-[#0B132B]/85 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-200">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-[#030712] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                  <th class="py-3.5 px-4 font-semibold">Timestamp (UTC)</th>
                  <th class="py-3.5 px-4 font-semibold">Transaction ID</th>
                  <th class="py-3.5 px-4 font-semibold">Risk Score</th>
                  <th class="py-3.5 px-4 font-semibold">Decision</th>
                  <th class="py-3.5 px-4 font-semibold">Logged Reasons</th>
                  <th class="py-3.5 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-mono">
                @for (log of filteredLogs; track log.transaction_id) {
                  <tr
                    (click)="selectRecord(log)"
                    class="hover:bg-slate-900/60 cursor-pointer transition-colors"
                    [ngClass]="selectedRecord?.transaction_id === log.transaction_id ? 'bg-cyan-950/30' : ''"
                  >
                    <td class="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {{ log.timestamp | date:'yyyy-MM-dd HH:mm:ss' }}
                    </td>
                    <td class="py-3.5 px-4 font-bold text-cyan-300">
                      {{ log.transaction_id }}
                    </td>
                    <td class="py-3.5 px-4 font-sans">
                      <app-score-meter [score]="log.risk_score"></app-score-meter>
                    </td>
                    <td class="py-3.5 px-4 font-sans">
                      <app-decision-badge [decision]="log.decision"></app-decision-badge>
                    </td>
                    <td class="py-3.5 px-4 text-slate-300 text-[11px] max-w-[200px] truncate" [title]="log.reason_codes.join(', ')">
                      {{ log.reason_codes.join(', ') }}
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <button
                        (click)="selectRecord(log); $event.stopPropagation()"
                        class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Selected Record Detail Drawer (4 cols) -->
        @if (selectedRecord) {
          <div class="lg:col-span-4 bg-[#0B132B]/85 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-xl animate-fade-in">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Audit Inspection</div>
                <h3 class="text-sm font-bold font-mono text-white mt-0.5">{{ selectedRecord.transaction_id }}</h3>
              </div>
              <button
                (click)="selectedRecord = null"
                class="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <!-- Decision & Score Summary -->
            <div class="p-3.5 rounded-xl bg-[#030712] border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400 font-mono">Decision:</span>
                <app-decision-badge [decision]="selectedRecord.decision"></app-decision-badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400 font-mono">Fraud Probability:</span>
                <span class="font-mono font-bold text-cyan-300">{{ ((selectedRecord.risk_score) * 100).toFixed(2) }}%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400 font-mono">Timestamp:</span>
                <span class="font-mono text-[11px] text-slate-300">{{ selectedRecord.timestamp | date:'yyyy-MM-dd HH:mm:ss' }}</span>
              </div>
            </div>

            <!-- Reason Codes -->
            <div class="space-y-1.5">
              <div class="text-xs font-bold text-slate-300 font-mono">Regulatory Reason Codes:</div>
              @for (reason of selectedRecord.reason_codes; track reason) {
                <div class="p-2 rounded-lg bg-[#030712] border border-slate-800 text-[11px] font-mono text-cyan-300 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span>{{ reason }}</span>
                </div>
              }
            </div>

            <!-- Redacted Payload JSON Dump -->
            <div class="space-y-1.5">
              <div class="text-xs font-bold text-slate-300 font-mono">Audit Record Dump:</div>
              <pre class="p-3 bg-[#030712] rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-48 select-all"><code>{{ selectedRecord | json }}</code></pre>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AuditComponent implements OnInit {
  private txService = inject(TransactionService);

  logs: AuditRecord[] = [];
  filteredLogs: AuditRecord[] = [];
  selectedRecord: AuditRecord | null = null;

  searchFilter = '';
  decisionFilter = 'ALL';

  ngOnInit(): void {
    this.logs = this.txService.getAuditLogs();
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.logs];

    if (this.searchFilter.trim()) {
      const q = this.searchFilter.toLowerCase().trim();
      result = result.filter((l) =>
        l.transaction_id.toLowerCase().includes(q)
      );
    }

    if (this.decisionFilter !== 'ALL') {
      result = result.filter((l) => l.decision === this.decisionFilter);
    }

    this.filteredLogs = result;
  }

  selectRecord(record: AuditRecord): void {
    this.selectedRecord = record;
  }
}
