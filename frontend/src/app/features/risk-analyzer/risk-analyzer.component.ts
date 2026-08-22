import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { RiskService } from '../../core/services/risk.service';
import { TransactionService } from '../../core/services/transaction.service';
import { DemoScenario, PredictResponse } from '../../core/models/risk.models';
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
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold rounded font-mono uppercase">Interactive Studio</span>
        </div>
        <h2 class="text-xl font-bold text-surface-900 tracking-tight mt-1">Transaction Risk Analyzer</h2>
        <p class="text-xs text-surface-500 mt-1">
          Evaluate checkout events in real time against the frozen Phase 3 GBDT model and Phase 4 decision policy via FastAPI (<code class="bg-surface-200 px-1 py-0.5 rounded font-mono text-[11px]">POST /predict</code>).
        </p>
      </div>

      <!-- Try A Scenario Toolbar -->
      <div class="bg-white border border-surface-200 rounded-lg p-4 shadow-card">
        <div class="text-xs font-bold text-surface-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>⚡ Try a Pre-Configured Benchmark Scenario</span>
          <span class="text-[10px] text-surface-400 font-mono font-normal">Click scenario to populate form, then click Evaluate</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
          @for (scenario of demoScenarios; track scenario.id) {
            <button
              type="button"
              (click)="loadScenario(scenario)"
              class="p-2.5 text-left rounded border transition-all duration-150"
              [ngClass]="
                selectedScenarioId === scenario.id
                  ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-500 text-brand-900'
                  : 'bg-surface-50 hover:bg-surface-100 border-surface-200 text-surface-800'
              "
            >
              <div class="text-xs font-bold truncate">{{ scenario.title }}</div>
              <div class="text-[10px] font-mono mt-1 text-surface-500 truncate">{{ scenario.category }}</div>
            </button>
          }
        </div>
      </div>

      <!-- Main Two-Column Layout: Form & Results -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Input Form (7 cols) -->
        <div class="lg:col-span-7 bg-white border border-surface-200 rounded-lg p-5 shadow-card">
          <form [formGroup]="analyzerForm" (ngSubmit)="evaluate()">
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-surface-200">
              <h3 class="text-xs font-bold uppercase tracking-wider text-surface-800">Point-in-Time Observable Features</h3>
              <span class="text-[11px] font-mono text-surface-400">33 Features Contract</span>
            </div>

            <!-- Transaction Identifier -->
            <div class="mb-4">
              <label class="block text-[11px] font-bold text-surface-600 uppercase tracking-wider mb-1">Transaction ID</label>
              <input
                type="text"
                formControlName="transaction_id"
                class="w-full px-3 py-1.5 text-xs bg-surface-50 border border-surface-200 rounded font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <!-- Section 1: Order Context -->
            <div class="mb-4">
              <h4 class="text-xs font-bold text-surface-700 mb-2">1. Order Context</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label class="block text-[10px] text-surface-500 font-semibold mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    formControlName="amount"
                    class="w-full px-2.5 py-1.5 bg-surface-50 border border-surface-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-surface-500 font-semibold mb-1">Product Category</label>
                  <select formControlName="product_category" class="w-full px-2.5 py-1.5 bg-surface-50 border border-surface-200 rounded text-xs">
                    <option value="electronics">electronics</option>
                    <option value="apparel">apparel</option>
                    <option value="home_goods">home_goods</option>
                    <option value="groceries">groceries</option>
                    <option value="beauty">beauty</option>
                    <option value="digital_goods">digital_goods</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] text-surface-500 font-semibold mb-1">Promo Used?</label>
                  <select formControlName="is_promo_used" class="w-full px-2.5 py-1.5 bg-surface-50 border border-surface-200 rounded text-xs">
                    <option [ngValue]="1">1 - YES</option>
                    <option [ngValue]="0">0 - NO</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Section 2: Account Profile -->
            <div class="mb-4">
              <h4 class="text-xs font-bold text-surface-700 mb-2">2. Account Profile & Tenure</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label class="block text-[10px] text-surface-500 font-semibold mb-1">Account Age (Days)</label>
                  <input
                    type="number"
                    step="0.1"
                    formControlName="account_age_days"
                    class="w-full px-2.5 py-1.5 bg-surface-50 border border-surface-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-surface-500 font-semibold mb-1">Email Domain</label>
                  <input
                    type="text"
                    formControlName="email_domain"
                    class="w-full px-2.5 py-1.5 bg-surface-50 border border-surface-200 rounded font-mono text-xs"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-surface-500 font-semibold mb-1">Prior Tx Count</label>
                  <input
                    type="number"
                    formControlName="user_historical_tx_count"
                    class="w-full px-2.5 py-1.5 bg-surface-50 border border-surface-200 rounded font-mono"
                  />
                </div>
              </div>
            </div>

            <!-- Section 3: Point-in-Time Velocity -->
            <div class="mb-4">
              <h4 class="text-xs font-bold text-surface-700 mb-2">3. Velocity & Bursts</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label class="block text-[10px] text-surface-500 font-semibold mb-1">1h Velocity</label>
                  <input
                    type="number"
                    formControlName="user_tx_count_1h"
                    class="w-full px-2.5 py-1.5 bg-surface-50 border border-surface-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-surface-500 font-semibold mb-1">24h Velocity</label>
                  <input
                    type="number"
                    formControlName="user_tx_count_24h"
                    class="w-full px-2.5 py-1.5 bg-surface-50 border border-surface-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-surface-500 font-semibold mb-1">Hour of Day (0-23)</label>
                  <input
                    type="number"
                    formControlName="hour_of_day"
                    class="w-full px-2.5 py-1.5 bg-surface-50 border border-surface-200 rounded font-mono"
                  />
                </div>
              </div>
            </div>

            <!-- Section 4: Incremental Graph Collusion Signals -->
            <div class="mb-5 p-3.5 bg-surface-50 rounded-lg border border-surface-200">
              <h4 class="text-xs font-bold text-surface-800 mb-2">4. Relational Graph Infrastructure</h4>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label class="block text-[10px] text-surface-500 font-semibold mb-0.5">Device Prior Users</label>
                  <input
                    type="number"
                    formControlName="device_prior_user_count"
                    class="w-full px-2 py-1 bg-white border border-surface-200 rounded font-mono text-xs"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-surface-500 font-semibold mb-0.5">IP Prior Users</label>
                  <input
                    type="number"
                    formControlName="ip_prior_user_count"
                    class="w-full px-2 py-1 bg-white border border-surface-200 rounded font-mono text-xs"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-surface-500 font-semibold mb-0.5">Payment Prior Users</label>
                  <input
                    type="number"
                    formControlName="payment_prior_user_count"
                    class="w-full px-2 py-1 bg-white border border-surface-200 rounded font-mono text-xs"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-surface-500 font-semibold mb-0.5">Connected Users</label>
                  <input
                    type="number"
                    formControlName="number_of_prior_connected_users"
                    class="w-full px-2 py-1 bg-white border border-surface-200 rounded font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              @if (isLoading) {
                <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Evaluating against Risk Engine...</span>
              } @else {
                <span>⚡ Evaluate Transaction (POST /predict)</span>
              }
            </button>
          </form>
        </div>

        <!-- Evaluation Results (5 cols) -->
        <div class="lg:col-span-5 space-y-4">
          @if (errorMessage) {
            <div class="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs space-y-2">
              <div class="font-bold flex items-center justify-between">
                <span class="flex items-center gap-1.5">⚠️ Risk Engine Error</span>
                <button
                  type="button"
                  (click)="evaluate()"
                  class="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition-colors"
                >
                  Retry Evaluation
                </button>
              </div>
              <p class="font-mono text-[11px] leading-relaxed bg-white/70 p-2 rounded border border-rose-100">{{ errorMessage }}</p>
              <div class="text-[10px] text-rose-600">
                Notice: The UI refuses to show simulated or fabricated risk scores when the backend is unavailable.
              </div>
            </div>
          }

          @if (evaluationResult) {
            <!-- Main Result Card -->
            <div class="bg-white border border-surface-200 rounded-lg p-5 shadow-card space-y-4 animate-in fade-in duration-300">
              <div class="flex items-center justify-between pb-3 border-b border-surface-200">
                <div>
                  <div class="text-[10px] font-bold text-surface-400 uppercase">Evaluation Result</div>
                  <div class="font-mono font-bold text-sm text-surface-900 mt-0.5">{{ evaluationResult.transaction_id }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <app-risk-badge [level]="evaluationResult.risk_level"></app-risk-badge>
                  <app-decision-badge [decision]="evaluationResult.decision"></app-decision-badge>
                </div>
              </div>

              <!-- Risk Score Box -->
              <div
                class="p-4 rounded-lg border text-center"
                [ngClass]="{
                  'bg-emerald-50 border-emerald-200 text-emerald-950': evaluationResult.decision === 'APPROVE',
                  'bg-amber-50 border-amber-200 text-amber-950': evaluationResult.decision === 'REVIEW',
                  'bg-rose-50 border-rose-200 text-rose-950': evaluationResult.decision === 'BLOCK'
                }"
              >
                <div class="text-xs font-bold uppercase tracking-wider opacity-80">Calculated Risk Score</div>
                <div class="text-4xl font-bold font-mono my-1 tracking-tight">
                  {{ (evaluationResult.risk_score * 100).toFixed(2) }}%
                </div>
                <div class="max-w-xs mx-auto mt-2">
                  <app-score-meter [score]="evaluationResult.risk_score"></app-score-meter>
                </div>
                <div class="text-[11px] mt-2 font-medium opacity-90">
                  Policy: {{ evaluationResult.decision }} (Threshold: tau=0.90)
                </div>
              </div>

              <!-- Reason Codes -->
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">Ranked Reason Codes</h4>
                <div class="space-y-2">
                  @for (reason of evaluationResult.reason_codes; track reason.code) {
                    <div class="p-3 bg-surface-50 border border-surface-200 rounded-lg text-xs">
                      <div class="font-mono font-bold text-surface-900 text-[11px]">{{ reason.code }}</div>
                      <p class="text-surface-600 text-[11px] mt-0.5">{{ reason.message }}</p>
                      @if (reason.evidence && (reason.evidence | json) !== '{}') {
                        <div class="mt-1.5 text-[10px] font-mono bg-white p-1.5 rounded border border-surface-200 text-surface-700">
                          Evidence: {{ reason.evidence | json }}
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Model Metadata -->
              <div class="pt-3 border-t border-surface-100 text-[10px] font-mono text-surface-400 flex items-center justify-between">
                <span>Model: {{ evaluationResult.model_version }}</span>
                <span>Policy: {{ evaluationResult.policy_version }}</span>
              </div>
            </div>
          } @else {
            <div class="bg-white border border-surface-200 rounded-lg p-8 text-center text-surface-400 shadow-card">
              <div class="text-3xl mb-2">⚡</div>
              <div class="text-xs font-bold text-surface-700">Awaiting Transaction Input</div>
              <p class="text-[11px] text-surface-400 mt-1 max-w-xs mx-auto">
                Select a demo scenario above or enter custom feature values, then click Evaluate to score against the live model.
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
  private txService = inject(TransactionService);

  demoScenarios: DemoScenario[] = [];
  selectedScenarioId = '';
  isLoading = false;
  errorMessage: string | null = null;
  evaluationResult: PredictResponse | null = null;

  analyzerForm!: FormGroup;

  ngOnInit(): void {
    this.demoScenarios = this.txService.demoScenarios;
    this.initForm();
    // Default load Coordinated Abuse scenario
    this.loadScenario(this.demoScenarios[0]);
  }

  private initForm() {
    this.analyzerForm = this.fb.group({
      transaction_id: ['tx_analyzer_001', Validators.required],
      amount: [249.99, Validators.required],
      product_category: ['electronics', Validators.required],
      is_promo_used: [1, Validators.required],
      hour_of_day: [3, Validators.required],
      day_of_week: [2],
      is_weekend: [0],
      billing_shipping_match: [0],
      account_age_days: [0.45, Validators.required],
      email_domain: ['tempmail.org', Validators.required],
      user_tx_count_1h: [2, Validators.required],
      user_tx_count_24h: [4, Validators.required],
      user_tx_count_7d: [4],
      user_historical_tx_count: [1],
      user_historical_mean_amount: [249.99],
      user_historical_std_amount: [0.0],
      amount_to_user_mean_ratio: [1.0],
      user_promo_rate: [1.0],
      user_unique_device_count: [1],
      user_unique_ip_count: [2],
      user_unique_payment_count: [1],
      user_unique_address_count: [1],
      device_prior_user_count: [7, Validators.required],
      ip_prior_user_count: [4, Validators.required],
      payment_prior_user_count: [6, Validators.required],
      shipping_address_prior_user_count: [1],
      billing_address_prior_user_count: [0],
      max_shared_entity_user_count: [7],
      number_of_prior_connected_users: [8, Validators.required],
      shared_entity_types_count: [3],
      connected_component_user_count: [8],
      connected_component_total_nodes: [14],
      connected_component_edge_count: [22],
      connected_component_density: [0.2418],
    });
  }

  loadScenario(scenario: DemoScenario) {
    this.selectedScenarioId = scenario.id;
    this.errorMessage = null;
    this.evaluationResult = null;

    this.analyzerForm.patchValue({
      transaction_id: scenario.transaction_id,
      ...scenario.features,
    });
  }

  evaluate() {
    if (this.analyzerForm.invalid) {
      this.errorMessage = 'Please complete all required feature fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const formVal = this.analyzerForm.value;

    const txId = formVal.transaction_id;
    const features = { ...formVal };
    delete features.transaction_id;

    this.riskService.evaluateTransaction({ transaction_id: txId, features }).subscribe({
      next: (res) => {
        this.evaluationResult = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Evaluation request failed.';
        this.isLoading = false;
      },
    });
  }
}
