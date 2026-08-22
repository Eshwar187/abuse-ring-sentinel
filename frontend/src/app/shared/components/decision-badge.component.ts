import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskDecision } from '../../core/models/risk.models';

@Component({
  selector: 'app-decision-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-bold tracking-wider uppercase border font-mono"
      [ngClass]="{
        'bg-emerald-600 text-white border-emerald-700': decision() === 'APPROVE',
        'bg-amber-500 text-white border-amber-600': decision() === 'REVIEW',
        'bg-rose-600 text-white border-rose-700': decision() === 'BLOCK'
      }"
    >
      {{ decision() }}
    </span>
  `,
})
export class DecisionBadgeComponent {
  decision = input.required<RiskDecision>();
}
