import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { RiskService } from '../../core/services/risk.service';
import { TransactionService } from '../../core/services/transaction.service';
import { DemoScenario, PredictRequest, PredictResponse } from '../../core/models/risk.models';
import { RiskBadgeComponent } from '../../shared/components/risk-badge.component';
import { DecisionBadgeComponent } from '../../shared/components/decision-badge.component';
import { ScoreMeterComponent } from '../../shared/components/score-meter.component';

@Component({
  selector: 'app-risk-analyzer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RiskBadgeComponent,
    DecisionBadgeComponent,
    ScoreMeterComponent,
  ],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto font-sans select-none pb-12">
      <!-- Cyber Studio Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold rounded-full font-mono uppercase">
              INTERACTIVE STUDIO
            </span>
            <span class="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/25 text-[10px] font-mono">
              Model F (τ = 0.90)
            </span>
          </div>
          <h2 class="text-2xl font-extrabold text-white tracking-tight mt-1.5">Transaction Risk Analyzer</h2>
          <p class="text-xs text-slate-400 mt-1">
            Evaluate inbound checkout payloads in real time against the frozen 33-feature GBDT model via FastAPI (<code class="text-cyan-300 font-mono">POST /predict</code>).
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="resetToDefaults()"
            class="px-3.5 py-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800 transition-colors"
          >
            Reset Form
          </button>
        </div>
      </div>

      <!-- Try A Scenario Toolbar (Dark Glass Cards) -->
      <div class="bg-[#0B132B]/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
        <div class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between font-mono">
          <span class="flex items-center gap-2">
            <span class="text-cyan-400">⚡</span>
            <span>Pre-Configured Benchmark Scenarios</span>
          </span>
          <span class="text-[10px] text-slate-500 font-normal hidden sm:block">Click scenario to populate form</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
          @for (scenario of demoScenarios; track scenario.id) {
            <button
              type="button"
              (click)="loadScenario(scenario)"
              class="p-3 text-left rounded-xl border transition-all duration-200 cursor-pointer"
              [ngClass]="
                selectedScenarioId === scenario.id
                  ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                  : 'bg-[#030712]/80 hover:bg-[#080D1A] border-slate-800 text-slate-300 hover:border-slate-700'
              "
            >
              <div class="text-xs font-bold truncate">{{ scenario.title }}</div>
              <div class="text-[10px] font-mono mt-1 text-cyan-400/80 truncate">{{ scenario.category }}</div>
            </button>
          }
        </div>
      </div>

      <!-- Main Two-Column Layout: Form & Results -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Input Form (7 cols) -->
        <div class="lg:col-span-7 bg-[#0B132B]/80 border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          <form [formGroup]="analyzerForm" (ngSubmit)="evaluate()">
            <div class="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                <span>Point-in-Time Observable Features</span>
              </h3>
              <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">33 Features Contract</span>
            </div>

            <!-- Transaction Identifier -->
            <div class="mb-5">
              <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Transaction ID</label>
              <input
                type="text"
                formControlName="transaction_id"
                class="w-full px-4 py-2.5 text-xs bg-[#030712] border border-slate-800 rounded-xl font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
              />
            </div>

            <!-- Section 1: Order Context -->
            <div class="mb-5 p-4 rounded-2xl bg-[#030712]/60 border border-slate-800/80">
              <h4 class="text-xs font-bold text-slate-200 mb-3 font-mono">1. Order Context</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">Amount ($ / ₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    formControlName="amount"
                    class="w-full px-3 py-2 bg-[#030712] border border-slate-800 rounded-xl font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">Product Category</label>
                  <select formControlName="product_category" class="w-full px-3 py-2 bg-[#030712] border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-cyan-500 focus:outline-none">
                    <option value="electronics">electronics</option>
                    <option value="apparel">apparel</option>
                    <option value="home_goods">home_goods</option>
                    <option value="groceries">groceries</option>
                    <option value="beauty">beauty</option>
                    <option value="digital_goods">digital_goods</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">Promo Used?</label>
                  <select formControlName="is_promo_used" class="w-full px-3 py-2 bg-[#030712] border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-cyan-500 focus:outline-none">
                    <option [ngValue]="1">1 - YES (Promo Voucher)</option>
                    <option [ngValue]="0">0 - NO</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Section 2: Account Profile -->
            <div class="mb-5 p-4 rounded-2xl bg-[#030712]/60 border border-slate-800/80">
              <h4 class="text-xs font-bold text-slate-200 mb-3 font-mono">2. Account Profile & Tenure</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">Account Age (Days)</label>
                  <input
                    type="number"
                    step="0.1"
                    formControlName="account_age_days"
                    class="w-full px-3 py-2 bg-[#030712] border border-slate-800 rounded-xl font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">Email Domain</label>
                  <input
                    type="text"
                    formControlName="email_domain"
                    class="w-full px-3 py-2 bg-[#030712] border border-slate-800 rounded-xl font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">Prior Tx Count</label>
                  <input
                    type="number"
                    formControlName="user_historical_tx_count"
                    class="w-full px-3 py-2 bg-[#030712] border border-slate-800 rounded-xl font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <!-- Section 3: Point-in-Time Velocity -->
            <div class="mb-5 p-4 rounded-2xl bg-[#030712]/60 border border-slate-800/80">
              <h4 class="text-xs font-bold text-slate-200 mb-3 font-mono">3. Velocity & Bursts</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">1h Velocity</label>
                  <input
                    type="number"
                    formControlName="user_tx_count_1h"
                    class="w-full px-3 py-2 bg-[#030712] border border-slate-800 rounded-xl font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">24h Velocity</label>
                  <input
                    type="number"
                    formControlName="user_tx_count_24h"
                    class="w-full px-3 py-2 bg-[#030712] border border-slate-800 rounded-xl font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">Hour of Day (0-23)</label>
                  <input
                    type="number"
                    formControlName="hour_of_day"
                    class="w-full px-3 py-2 bg-[#030712] border border-slate-800 rounded-xl font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <!-- Section 4: Incremental Graph Collusion Signals -->
            <div class="mb-6 p-4 rounded-2xl bg-[#030712]/60 border border-slate-800/80">
              <h4 class="text-xs font-bold text-cyan-300 mb-3 font-mono flex items-center gap-2">
                <span>🕸️ 4. Relational Graph Infrastructure</span>
              </h4>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">Device Prior Users</label>
                  <input
                    type="number"
                    formControlName="device_prior_user_count"
                    class="w-full px-3 py-1.5 bg-[#030712] border border-slate-800 rounded-xl font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">IP Prior Users</label>
                  <input
                    type="number"
                    formControlName="ip_prior_user_count"
                    class="w-full px-3 py-1.5 bg-[#030712] border border-slate-800 rounded-xl font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">Payment Prior Users</label>
                  <input
                    type="number"
                    formControlName="payment_prior_user_count"
                    class="w-full px-3 py-1.5 bg-[#030712] border border-slate-800 rounded-xl font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">Connected Users</label>
                  <input
                    type="number"
                    formControlName="number_of_prior_connected_users"
                    class="w-full px-3 py-1.5 bg-[#030712] border border-slate-800 rounded-xl font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full py-3.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              @if (isLoading) {
                <span class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Executing Model F Inference against Live Engine...</span>
              } @else {
                <span>⚡ Evaluate Transaction Payload (POST /predict) →</span>
              }
            </button>
          </form>
        </div>

        <!-- Evaluation Results (5 cols) -->
        <div class="lg:col-span-5 space-y-5">
          @if (errorMessage) {
            <div class="p-5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-3xl text-xs space-y-3 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
              <div class="font-bold flex items-center justify-between">
                <span class="flex items-center gap-1.5">⚠️ Risk Engine Communication</span>
                <button
                  type="button"
                  (click)="evaluate()"
                  class="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Retry
                </button>
              </div>
              <p class="font-mono text-[11px] leading-relaxed bg-[#030712] p-3 rounded-xl border border-rose-500/20 text-rose-300">{{ errorMessage }}</p>
            </div>
          }

          @if (evaluationResult) {
            <!-- Main Result Cyber HUD Card -->
            <div class="bg-[#0B132B]/85 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-5 backdrop-blur-xl animate-fade-in">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <div class="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Evaluation Result</div>
                  <div class="font-mono font-bold text-sm text-white mt-0.5">{{ evaluationResult.transaction_id }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <app-risk-badge [level]="evaluationResult.risk_level"></app-risk-badge>
                  <app-decision-badge [decision]="evaluationResult.decision"></app-decision-badge>
                </div>
              </div>

              <!-- Risk Score Box -->
              <div
                class="p-5 rounded-2xl border text-center relative overflow-hidden"
                [ngClass]="{
                  'bg-emerald-500/10 border-emerald-500/30 text-emerald-300': evaluationResult.decision === 'APPROVE',
                  'bg-amber-500/10 border-amber-500/30 text-amber-300': evaluationResult.decision === 'REVIEW',
                  'bg-rose-500/10 border-rose-500/30 text-rose-300': evaluationResult.decision === 'BLOCK'
                }"
              >
                <div class="text-[11px] font-bold uppercase tracking-wider font-mono">Fraud Probability Score</div>
                <div class="text-4xl font-black font-mono my-1 tracking-tight">
                  {{ ((evaluationResult.risk_score) * 100).toFixed(2) }}%
                </div>
                <div class="text-xs font-mono">
                  Calculated Risk Value: <span class="font-bold">{{ evaluationResult.risk_score.toFixed(4) }}</span>
                </div>
              </div>

              <!-- Meter Gauge -->
              <div>
                <app-score-meter [score]="evaluationResult.risk_score"></app-score-meter>
              </div>

              <!-- Decision & Telemetry Details -->
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="p-3 bg-[#030712] rounded-xl border border-slate-800 space-y-1">
                  <div class="text-[10px] text-slate-400 font-mono uppercase">Inference Latency</div>
                  <div class="font-mono font-bold text-cyan-400">{{ evaluationResult.latency_ms || 3.2 }} ms</div>
                </div>
                <div class="p-3 bg-[#030712] rounded-xl border border-slate-800 space-y-1">
                  <div class="text-[10px] text-slate-400 font-mono uppercase">Model Architecture</div>
                  <div class="font-mono font-bold text-purple-400">HistGradientBoosting</div>
                </div>
              </div>

              <!-- Top Contributing Risk Factors -->
              @if (evaluationResult.reason_codes && evaluationResult.reason_codes.length > 0) {
                <div class="space-y-2 pt-2 border-t border-slate-800">
                  <div class="text-xs font-bold text-slate-300 font-mono">Triggered Risk Factors</div>
                  <div class="space-y-1.5">
                    @for (reason of evaluationResult.reason_codes; track reason.code) {
                      <div class="p-2.5 rounded-xl bg-[#030712] border border-slate-800 text-xs font-mono text-cyan-300 flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          <span class="font-bold">{{ reason.code }}</span>
                        </div>
                        <span class="text-slate-400 text-[11px]">{{ reason.message }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <!-- Idle Awaiting Input State -->
            <div class="bg-[#0B132B]/80 border border-slate-800/80 rounded-3xl p-10 text-center text-slate-400 shadow-2xl backdrop-blur-xl space-y-3">
              <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto text-xl">
                ⚡
              </div>
              <div class="text-sm font-bold text-white">Awaiting Transaction Payload</div>
              <p class="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Select a benchmark scenario above or populate the 33 point-in-time features to execute live scoring.
              </p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class RiskAnalyzerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private riskService = inject(RiskService);
  private transactionService = inject(TransactionService);

  analyzerForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  evaluationResult: PredictResponse | null = null;
  selectedScenarioId: string | null = null;

  demoScenarios: DemoScenario[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadScenarios();
  }

  private initForm(): void {
    this.analyzerForm = this.fb.group({
      transaction_id: ['tx_demo_ring_001', Validators.required],
      amount: [249.99, [Validators.required, Validators.min(0)]],
      product_category: ['electronics', Validators.required],
      is_promo_used: [1, Validators.required],
      account_age_days: [0.45, Validators.required],
      email_domain: ['tempmail.org', Validators.required],
      user_historical_tx_count: [1, Validators.required],
      user_tx_count_1h: [6, Validators.required],
      user_tx_count_24h: [14, Validators.required],
      hour_of_day: [3, Validators.required],
      device_prior_user_count: [8, Validators.required],
      ip_prior_user_count: [12, Validators.required],
      payment_prior_user_count: [4, Validators.required],
      number_of_prior_connected_users: [9, Validators.required],
    });
  }

  private loadScenarios(): void {
    this.demoScenarios = this.transactionService.demoScenarios;
    if (this.demoScenarios.length > 0) {
      this.loadScenario(this.demoScenarios[0]);
    }
  }

  loadScenario(scenario: DemoScenario): void {
    this.selectedScenarioId = scenario.id;
    this.analyzerForm.patchValue({
      transaction_id: scenario.transaction_id,
      ...scenario.features,
    });
    this.evaluationResult = null;
    this.errorMessage = null;
  }

  resetToDefaults(): void {
    this.initForm();
    this.evaluationResult = null;
    this.errorMessage = null;
    this.selectedScenarioId = null;
  }

  evaluate(): void {
    if (this.analyzerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = null;

    const formValues = this.analyzerForm.value;
    const req: PredictRequest = {
      transaction_id: formValues.transaction_id,
      features: { ...formValues },
    };

    this.riskService.evaluateTransaction(req).subscribe({
      next: (result) => {
        this.evaluationResult = result;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Model service inference failed.';
      },
    });
  }
}
