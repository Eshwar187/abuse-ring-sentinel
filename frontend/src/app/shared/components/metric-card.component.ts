import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">{{ label }}</span>
        <div class="text-slate-400 text-sm">
          <ng-content select="[icon]"></ng-content>
        </div>
      </div>
      <div class="flex items-baseline gap-2">
        <span class="text-2xl font-bold font-mono tracking-tight text-white">{{ value }}</span>
        @if (unit) {
          <span class="text-xs text-slate-400 font-medium">{{ unit }}</span>
        }
      </div>
      <div class="mt-2 text-xs text-slate-400 flex items-center gap-1.5 truncate">
        <span class="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
        <span class="truncate">{{ context }}</span>
      </div>
    </div>
  `,
})
export class MetricCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() unit: string = '';
  @Input() context: string = 'Current evaluation window';
}
