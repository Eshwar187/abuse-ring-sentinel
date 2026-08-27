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
      class="w-full bg-[#030712]/95 border-b border-purple-500/30 text-slate-200 px-4 sm:px-6 py-2 text-xs font-mono backdrop-blur-2xl shadow-[0_4px_25px_rgba(0,0,0,0.5)] z-50 sticky top-0 select-none animate-fadeIn"
    >
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <!-- Left: Status Indicator & Headline -->
        <div class="flex items-center gap-3 text-center sm:text-left flex-wrap justify-center sm:justify-start">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(168,85,247,0.3)]">
            <span class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
            <span>{{ maintenanceConfig()?.maintenance_type || 'CORE UPGRADE' }}</span>
          </span>

          <span class="font-bold text-white tracking-wide flex items-center gap-1.5">
            <span>{{ maintenanceConfig()?.title || 'Core Engine Upgrade in Progress' }}</span>
          </span>

          <span class="hidden lg:inline text-slate-400 text-[11px] font-sans">
            — Real-time fraud protection active; database & model calibration underway.
          </span>
        </div>

        <!-- Right: Countdown Ticker, Diagnostics Link & Dismiss Button -->
        <div class="flex items-center gap-2.5 shrink-0">
          <div *ngIf="timeRemaining()" class="px-2.5 py-1 bg-[#0B132B]/90 border border-purple-500/30 rounded-xl text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 shadow-inner">
            <span class="text-slate-400 font-normal">⏳ Est. Time:</span>
            <span>{{ timeRemaining() }}</span>
          </div>

          <a
            routerLink="/maintenance"
            class="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-purple-500/20"
          >
            <span>Live Diagnostics</span>
            <span>→</span>
          </a>

          <button
            type="button"
            (click)="dismissBanner()"
            class="w-6 h-6 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition-colors cursor-pointer text-xs"
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
      <div class="px-3.5 py-2 bg-[#0B132B]/95 border border-purple-500/50 rounded-2xl text-[11px] font-mono text-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.3)] backdrop-blur-xl flex items-center gap-2 hover:scale-105 transition-transform">
        <span class="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
        <span class="font-bold text-white">Maintenance in Progress</span>
        <span class="text-xs text-purple-400">▲</span>
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
  readonly timeRemaining = signal<string>('02h 37m 19s');

  private pollInterval: any;
  private countdownInterval: any;

  ngOnInit(): void {
    this.adminService.fetchPublicMaintenanceStatus().subscribe();
    this.updateTimeRemaining();

    // Periodic poll for maintenance status updates (every 15s)
    this.pollInterval = setInterval(() => {
      this.adminService.fetchPublicMaintenanceStatus().subscribe();
    }, 15000);

    // Live countdown update (every 1s)
    this.countdownInterval = setInterval(() => {
      this.updateTimeRemaining();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  dismissBanner(): void {
    this.isDismissed.set(true);
  }

  restoreBanner(): void {
    this.isDismissed.set(false);
  }

  private updateTimeRemaining(): void {
    const config = this.maintenanceConfig();
    if (!config || !config.estimated_end_time) {
      this.timeRemaining.set('02h 37m 19s');
      return;
    }

    try {
      const endTime = new Date(config.estimated_end_time).getTime();
      const now = new Date().getTime();
      const diffMs = endTime - now;

      if (diffMs <= 0) {
        this.timeRemaining.set('Completing...');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const hStr = hours.toString().padStart(2, '0');
      const mStr = minutes.toString().padStart(2, '0');
      const sStr = seconds.toString().padStart(2, '0');

      this.timeRemaining.set(`${hStr}h ${mStr}m ${sStr}s`);
    } catch {
      this.timeRemaining.set('02h 37m 19s');
    }
  }
}
