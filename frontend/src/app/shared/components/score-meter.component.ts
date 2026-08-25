import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-meter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2.5">
      <div class="w-16 h-2 bg-slate-800 rounded-full overflow-hidden flex-shrink-0">
        <div
          class="h-full rounded-full transition-all duration-500"
          [style.width.%]="percentage"
          [ngClass]="{
            'bg-emerald-500': score < 0.50,
            'bg-amber-500': score >= 0.50 && score < 0.90,
            'bg-rose-500': score >= 0.90
          }"
        ></div>
      </div>
      <span class="font-mono text-xs font-semibold tabular-nums text-slate-200">
        {{ (score || 0).toFixed(4) }}
      </span>
    </div>
  `,
})
export class ScoreMeterComponent {
  @Input() score: number = 0;

  get percentage(): number {
    return Math.min(100, Math.max(0, (this.score || 0) * 100));
  }
}
