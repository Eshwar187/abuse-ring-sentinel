import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-surface-200 rounded-lg p-4 shadow-card hover:border-surface-300 transition-colors">
      <div class="flex items-center justify-between text-surface-500 mb-2">
        <span class="text-xs font-semibold uppercase tracking-wider">{{ label() }}</span>
        <div class="text-surface-400">
          <ng-content select="[icon]"></ng-content>
        </div>
      </div>
      <div class="flex items-baseline gap-2">
        <span class="text-2xl font-bold font-mono tracking-tight text-surface-900">{{ value() }}</span>
        @if (unit()) {
          <span class="text-xs text-surface-500 font-medium">{{ unit() }}</span>
        }
      </div>
      <div class="mt-2 text-xs text-surface-500 flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-surface-400"></span>
        {{ context() }}
      </div>
    </div>
  `,
})
export class MetricCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  unit = input<string>('');
  context = input<string>('Current evaluation window');
}
