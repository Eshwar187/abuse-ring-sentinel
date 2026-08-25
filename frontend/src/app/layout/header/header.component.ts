import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Search, Activity, Shield, Key } from 'lucide-angular';
import { HealthService } from '../../core/services/health.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <header class="h-14 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between flex-shrink-0 font-sans text-slate-300">
      <!-- Search Input -->
      <div class="flex items-center gap-4 flex-1 max-w-xl">
        <div class="relative w-full">
          <lucide-icon name="search" [size]="14" class="absolute inset-y-0 left-3 my-auto text-slate-400 pointer-events-none"></lucide-icon>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="handleSearch()"
            placeholder="Search live transactions by ID, User, or IP..."
            class="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
          />
        </div>
      </div>

      <!-- Right Metadata & Actions -->
      <div class="flex items-center gap-4">
        <!-- Live API Status Pill -->
        <div
          class="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border"
          [ngClass]="{
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': health.healthState().isOnline,
            'bg-rose-500/10 text-rose-400 border-rose-500/20': !health.healthState().isOnline
          }"
        >
          <span
            class="w-2 h-2 rounded-full"
            [ngClass]="{
              'bg-emerald-500': health.healthState().isOnline,
              'bg-rose-500 animate-pulse': !health.healthState().isOnline
            }"
          ></span>
          <span>{{ health.healthState().isOnline ? 'Gateway Connected' : 'Gateway Offline' }}</span>
        </div>

        <!-- Mode Badge -->
        <span class="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-[11px] font-bold font-mono">
          LIVE_ENGINE
        </span>

        <a
          routerLink="/app/settings"
          class="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          title="API Key Settings"
        >
          {{ auth.currentUser()?.api_key_masked }}
        </a>
      </div>
    </header>
  `,
})
export class HeaderComponent implements OnInit {
  health = inject(HealthService);
  auth = inject(AuthService);
  private router = inject(Router);
  searchQuery = '';

  ngOnInit(): void {
    this.health.checkHealth().subscribe();
  }

  handleSearch() {
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim();
      this.router.navigate(['/app/transactions'], { queryParams: { search: q } });
    }
  }
}
