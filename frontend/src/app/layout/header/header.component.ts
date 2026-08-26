import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Search, Activity, Shield, Key, Database, Cpu, Copy, Check } from 'lucide-angular';
import { HealthService } from '../../core/services/health.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <header class="h-16 bg-[#060A14]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 flex items-center justify-between flex-shrink-0 font-sans text-slate-300 z-20">
      <!-- Search Terminal Bar -->
      <div class="flex items-center gap-4 flex-1 max-w-xl">
        <div class="relative w-full group">
          <lucide-icon name="search" [size]="14" class="absolute inset-y-0 left-3.5 my-auto text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none"></lucide-icon>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="handleSearch()"
            placeholder="Search live transactions by ID, User, Device, or IP..."
            class="w-full pl-10 pr-12 py-2 bg-[#0B132B]/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10 font-mono transition-all shadow-inner"
          />
          <span class="absolute inset-y-0 right-3 my-auto flex items-center px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800/80 text-[10px] font-mono text-slate-400">
            ↵
          </span>
        </div>
      </div>

      <!-- Right HUD Telemetry Chips -->
      <div class="flex items-center gap-3">
        <!-- Live Engine Gateway Pill -->
        <div
          class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all"
          [ngClass]="{
            'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]': health.healthState().isOnline,
            'bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]': !health.healthState().isOnline
          }"
        >
          <span class="relative flex h-2 w-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              [ngClass]="health.healthState().isOnline ? 'bg-emerald-400' : 'bg-rose-400'"
            ></span>
            <span
              class="relative inline-flex rounded-full h-2 w-2"
              [ngClass]="health.healthState().isOnline ? 'bg-emerald-500' : 'bg-rose-500'"
            ></span>
          </span>
          <span class="text-[11px] font-mono font-medium">
            {{ health.healthState().isOnline ? 'GATEWAY ACTIVE' : 'GATEWAY DEGRADED' }}
          </span>
        </div>

        <!-- Model Telemetry Chip -->
        <div class="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono">
          <lucide-icon name="cpu" [size]="12" class="text-cyan-400"></lucide-icon>
          <span>MODEL F (τ*=0.90)</span>
        </div>

        <!-- Database Engine Chip -->
        <div class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono">
          <lucide-icon name="database" [size]="12" class="text-indigo-400"></lucide-icon>
          <span>CLOUD MYSQL</span>
        </div>

        <!-- API Key Session Chip -->
        <a
          routerLink="/app/integration"
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition-all"
          title="Manage API Keys & Webhooks"
        >
          <lucide-icon name="key" [size]="12" class="text-amber-400"></lucide-icon>
          <span class="text-[11px]">{{ auth.currentUser()?.api_key_masked || 'ars_live_••••••••' }}</span>
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
