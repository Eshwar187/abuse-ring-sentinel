import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-maintenance-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Top Global Banner (Visible when Maintenance Mode is Active) -->
    <div
      *ngIf="isMaintenanceActive() && !isDismissed()"
      class="w-full bg-gradient-to-r from-amber-950/95 via-[#0B132B]/98 to-purple-950/95 border-b border-amber-500/40 text-amber-200 px-4 py-2.5 text-xs font-mono backdrop-blur-2xl shadow-xl z-50 sticky top-0 select-none animate-fadeIn"
    >
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <!-- Left: Status Indicator & Headline -->
        <div class="flex items-center gap-2.5 text-center sm:text-left flex-wrap justify-center sm:justify-start">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>{{ maintenanceConfig()?.maintenance_type || 'SYSTEM UPGRADE' }}</span>
          </span>

          <span class="font-bold text-white tracking-wide">
            {{ maintenanceConfig()?.title || 'System Maintenance & Core Engine Calibration Scheduled' }}
          </span>

          <span class="hidden md:inline text-slate-400 text-[11px]">
            — Staged protection active; inference latency calibration underway.
          </span>
        </div>

        <!-- Right: Countdown Ticker, Diagnostics Link & Dismiss Button -->
        <div class="flex items-center gap-3 shrink-0">
          <div *ngIf="timeRemaining()" class="px-2.5 py-1 bg-[#030712]/90 border border-amber-500/30 rounded-lg text-[11px] font-bold text-amber-300 flex items-center gap-1.5 shadow-inner">
            <span>⏳ Resumption in:</span>
            <span class="text-cyan-300">{{ timeRemaining() }}</span>
          </div>

          <a
            routerLink="/maintenance"
            class="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white border border-amber-500/50 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Live Diagnostics</span>
            <span>→</span>
          </a>

          <button
            type="button"
            (click)="dismissBanner()"
            class="w-6 h-6 rounded-lg bg-[#030712]/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 flex items-center justify-center transition-colors cursor-pointer text-xs"
            title="Minimize Banner"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Re-Open Badge when User Dismisses Top Banner -->
    <div
      *ngIf="isMaintenanceActive() && isDismissed()"
      class="fixed bottom-4 right-4 z-50 animate-bounce cursor-pointer"
      (click)="restoreBanner()"
    >
      <div class="px-3 py-1.5 bg-[#0B132B]/95 border border-amber-500/50 rounded-full text-[11px] font-mono text-amber-300 shadow-2xl backdrop-blur-xl flex items-center gap-2 hover:scale-105 transition-transform">
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
        <span class="font-bold">Maintenance Window Active</span>
        <span class="text-xs">▲</span>
      </div>
    </div>
  `,
})
export class MaintenanceBannerComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private router = inject(Router);

  readonly maintenanceConfig = this.adminService.maintenanceConfig;
  readonly isMaintenanceActive = this.adminService.isMaintenanceActive;
  readonly isDismissed = signal(false);
  readonly timeRemaining = signal<string>('');

  private pollInterval: any;
  private countdownInterval: any;

  ngOnInit(): void {
    this.adminService.fetchPublicMaintenanceStatus().subscribe();
    this.updateTimeRemaining();

    // Periodic poll for maintenance status updates (every 20s)
    this.pollInterval = setInterval(() => {
      this.adminService.fetchPublicMaintenanceStatus().subscribe();
    }, 20000);

    // Live countdown update (every 1s)
    this.countdownInterval = setInterval(() => {
      this.updateTimeRemaining();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  private updateTimeRemaining(): void {
    const cfg = this.maintenanceConfig();
    if (!cfg || !cfg.is_active) {
      this.timeRemaining.set('');
      return;
    }

    let targetTime = Date.now() + 45 * 60 * 1000;
    if (cfg.estimated_end_time) {
      targetTime = new Date(cfg.estimated_end_time).getTime();
    }

    const diff = Math.max(0, targetTime - Date.now());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      this.timeRemaining.set(`${hours}h ${minutes}m ${seconds}s`);
    } else {
      this.timeRemaining.set(`${minutes}m ${seconds}s`);
    }
  }

  dismissBanner(): void {
    this.isDismissed.set(true);
  }

  restoreBanner(): void {
    this.isDismissed.set(false);
  }
}
