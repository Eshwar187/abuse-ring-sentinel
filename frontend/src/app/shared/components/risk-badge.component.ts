import { Component, Input } from '@angular/core';
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
        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30': level === 'LOW',
        'bg-amber-500/10 text-amber-400 border-amber-500/30': level === 'MEDIUM',
        'bg-rose-500/10 text-rose-400 border-rose-500/30': level === 'HIGH'
      }"
    >
      <span
        class="w-1.5 h-1.5 rounded-full"
        [ngClass]="{
          'bg-emerald-500': level === 'LOW',
          'bg-amber-500': level === 'MEDIUM',
          'bg-rose-500 animate-pulse': level === 'HIGH'
        }"
      ></span>
      {{ level || 'LOW' }} RISK
    </span>
  `,
})
export class RiskBadgeComponent {
  @Input() level: RiskLevel | string = 'LOW';
}
