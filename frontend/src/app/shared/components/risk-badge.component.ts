import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskLevel } from '../../core/models/risk.models';

@Component({
  selector: 'app-risk-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase border"
      [ngClass]="{
        'bg-emerald-50 text-emerald-700 border-emerald-200': level() === 'LOW',
        'bg-amber-50 text-amber-800 border-amber-200': level() === 'MEDIUM',
        'bg-rose-50 text-rose-700 border-rose-200': level() === 'HIGH'
      }"
    >
      <span
        class="w-1.5 h-1.5 rounded-full"
        [ngClass]="{
          'bg-emerald-500': level() === 'LOW',
          'bg-amber-500': level() === 'MEDIUM',
          'bg-rose-500 animate-pulse': level() === 'HIGH'
        }"
      ></span>
      {{ level() }} RISK
    </span>
  `,
})
export class RiskBadgeComponent {
  level = input.required<RiskLevel>();
}
