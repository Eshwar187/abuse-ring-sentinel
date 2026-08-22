import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HealthService } from '../../core/services/health.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="h-14 bg-white border-b border-surface-200 px-6 flex items-center justify-between flex-shrink-0">
      <!-- Search and Context -->
      <div class="flex items-center gap-4 flex-1 max-w-xl">
        <div class="relative w-full">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="handleSearch()"
            placeholder="Search transaction ID (e.g. tx_0027436), user, or device..."
            class="w-full pl-9 pr-4 py-1.5 bg-surface-50 border border-surface-200 rounded-md text-xs text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all font-mono"
          />
        </div>
      </div>

      <!-- Right Metadata & Actions -->
      <div class="flex items-center gap-4">
        <!-- Live API Status Pill -->
        <div
          class="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border"
          [ngClass]="{
            'bg-emerald-50 text-emerald-700 border-emerald-200': health.healthState().isOnline,
            'bg-rose-50 text-rose-700 border-rose-200': !health.healthState().isOnline
          }"
        >
          <span
            class="w-2 h-2 rounded-full"
            [ngClass]="{
              'bg-emerald-500': health.healthState().isOnline,
              'bg-rose-500 animate-pulse': !health.healthState().isOnline
            }"
          ></span>
          <span>{{ health.healthState().isOnline ? 'FastAPI Connected' : 'API Reconnecting' }}</span>
        </div>

        <!-- Mode Badge -->
        <span class="px-2.5 py-1 bg-surface-100 border border-surface-300 text-surface-700 rounded text-xs font-bold font-mono">
          MERCHANT_LIVE
        </span>

        <!-- Date Range Context -->
        <span class="text-xs text-surface-500 font-medium font-mono">
          Mar 16 – 31, 2026
        </span>
      </div>
    </header>
  `,
})
export class HeaderComponent implements OnInit {
  health = inject(HealthService);
  private router = inject(Router);
  searchQuery = '';

  ngOnInit(): void {
    this.health.checkHealth().subscribe();
  }

  handleSearch() {
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim();
      this.router.navigate(['/transactions', q]);
    }
  }
}
