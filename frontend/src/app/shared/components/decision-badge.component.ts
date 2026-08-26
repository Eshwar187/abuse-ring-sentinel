import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskDecision } from '../../core/models/risk.models';

@Component({
  selector: 'app-decision-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wider uppercase border font-mono backdrop-blur-md transition-all"
      [ngClass]="{
        'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.25)]': decision === 'APPROVE',
        'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-[0_0_14px_rgba(245,158,11,0.25)]': decision === 'REVIEW',
        'bg-rose-950/60 text-rose-300 border-rose-500/50 shadow-[0_0_16px_rgba(239,68,68,0.35)]': decision === 'BLOCK'
      }"
    >
      <span
        class="w-1.5 h-1.5 rounded-full"
        [ngClass]="{
          'bg-emerald-400': decision === 'APPROVE',
          'bg-amber-400': decision === 'REVIEW',
          'bg-rose-400 animate-ping': decision === 'BLOCK'
        }"
      ></span>
      <span>{{ decision || 'APPROVE' }}</span>
    </span>
  `,
})
export class DecisionBadgeComponent {
  @Input() decision: RiskDecision | string = 'APPROVE';
}
