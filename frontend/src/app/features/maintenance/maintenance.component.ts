import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between items-center px-4 py-8 font-sans relative overflow-hidden select-none">
      <!-- Ambient Laser Grid and Background Glows -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(168,85,247,0.2),transparent_60%),radial-gradient(circle_at_bottom_center,rgba(6,182,212,0.15),transparent_60%)] pointer-events-none"></div>
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#0B132B_1px,transparent_1px),linear-gradient(to_bottom,#0B132B_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      <!-- Top Header / Brand -->
      <header class="w-full max-w-5xl flex items-center justify-between z-10 pt-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <span class="text-xl">🛡️</span>
          </div>
          <div>
            <div class="text-base font-black tracking-wider text-white flex items-center gap-2">
              <span>VigilAI</span>
              <span class="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-mono rounded-full uppercase">
                Core Engine
              </span>
            </div>
            <p class="text-[10px] text-slate-400 font-mono">Autonomous Abuse-Ring Sentinel</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            (click)="checkStatus()"
            [disabled]="isChecking"
            class="px-3.5 py-1.5 bg-[#0B132B]/80 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-xs font-mono text-cyan-300 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span class="w-2 h-2 rounded-full bg-cyan-400" [ngClass]="{'animate-ping': isChecking}"></span>
            <span>{{ isChecking ? 'Checking Telemetry...' : 'Refresh Status' }}</span>
          </button>

          <a
            routerLink="/admin/login"
            class="px-3.5 py-1.5 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 text-purple-300 text-xs font-mono rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔐 Admin Bypass</span>
          </a>
        </div>
      </header>

      <!-- Center Hero & Cyber Radar -->
      <main class="w-full max-w-4xl flex flex-col items-center text-center z-10 my-auto py-10 space-y-8">
        <!-- Holographic Pulsing Radar -->
        <div class="relative flex items-center justify-center">
          <!-- Outer Pulsing Rings -->
          <div class="absolute w-48 h-48 rounded-full border border-purple-500/20 animate-ping opacity-25"></div>
          <div class="absolute w-64 h-64 rounded-full border border-cyan-500/15 animate-pulse"></div>
          <div class="absolute w-80 h-80 rounded-full border border-dashed border-purple-500/10 animate-[spin_20s_linear_infinite]"></div>

          <div class="w-32 h-32 rounded-3xl bg-gradient-to-tr from-purple-900/70 via-[#0B132B] to-cyan-950/70 border-2 border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.4)] flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-xl group">
            <div class="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent animate-pulse pointer-events-none"></div>
            <span class="text-5xl filter drop-shadow-[0_0_15px_rgba(168,85,247,0.9)] animate-bounce">⚡</span>
          </div>
        </div>

        <!-- Headline & Notice -->
        <div class="space-y-3 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-mono">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span class="font-bold tracking-wider uppercase">{{ maintenanceConfig()?.maintenance_type || 'SCHEDULED SYSTEM CALIBRATION' }}</span>
          </div>

          <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {{ maintenanceConfig()?.title || 'System Maintenance & Core Engine Calibration' }}
          </h1>

          <p class="text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
            {{ maintenanceConfig()?.message || 'VigilAI fraud intelligence engine is undergoing scheduled model calibration, graph index optimization, and latency tuning. Staged defense pipelines remain active.' }}
          </p>
        </div>

        <!-- Live Countdown Timer -->
        <div class="bg-[#0B132B]/85 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-xl shadow-2xl w-full max-w-xl">
          <div class="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-center gap-2">
            <span class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping"></span>
            <span>Estimated Resumption Countdown</span>
          </div>

          <div class="grid grid-cols-4 gap-3">
            <div class="bg-[#030712] border border-slate-800 rounded-xl p-3">
              <div class="text-2xl sm:text-3xl font-black font-mono text-cyan-400">{{ countdown().hours }}</div>
              <div class="text-[10px] uppercase font-mono text-slate-500 mt-1">Hours</div>
            </div>
            <div class="bg-[#030712] border border-slate-800 rounded-xl p-3">
              <div class="text-2xl sm:text-3xl font-black font-mono text-purple-400">{{ countdown().minutes }}</div>
              <div class="text-[10px] uppercase font-mono text-slate-500 mt-1">Minutes</div>
            </div>
            <div class="bg-[#030712] border border-slate-800 rounded-xl p-3">
              <div class="text-2xl sm:text-3xl font-black font-mono text-pink-400">{{ countdown().seconds }}</div>
              <div class="text-[10px] uppercase font-mono text-slate-500 mt-1">Seconds</div>
            </div>
            <div class="bg-[#030712] border border-slate-800 rounded-xl p-3">
              <div class="text-2xl sm:text-3xl font-black font-mono text-emerald-400">{{ countdown().millis }}</div>
              <div class="text-[10px] uppercase font-mono text-slate-500 mt-1">MS</div>
            </div>
          </div>
        </div>

        <!-- System Diagnostics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl text-left">
          <div class="bg-[#0B132B]/60 border border-slate-800 rounded-xl p-3.5">
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>GBDT Model F</span>
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            </div>
            <div class="text-xs font-bold text-white font-mono">Calibrating Trees</div>
          </div>

          <div class="bg-[#0B132B]/60 border border-slate-800 rounded-xl p-3.5">
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Bipartite Graph</span>
              <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            </div>
            <div class="text-xs font-bold text-white font-mono">Indexing Nodes</div>
          </div>

          <div class="bg-[#0B132B]/60 border border-slate-800 rounded-xl p-3.5">
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Cloud MySQL</span>
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div class="text-xs font-bold text-white font-mono">SSL Online</div>
          </div>

          <div class="bg-[#0B132B]/60 border border-slate-800 rounded-xl p-3.5">
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Sentinel Armor</span>
              <span class="w-2 h-2 rounded-full bg-purple-400"></span>
            </div>
            <div class="text-xs font-bold text-white font-mono">Quarantine Active</div>
          </div>
        </div>
      </main>

      <!-- Bottom Footer -->
      <footer class="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 z-10 border-t border-slate-900 pt-6 font-mono">
        <div class="flex items-center gap-2">
          <span>Status Code: 503 SERVICE_UPGRADE</span>
          <span>•</span>
          <span>Incident: #CAL-{{ incidentId }}</span>
        </div>
        <div class="flex items-center gap-4">
          <a href="mailto:security@vigilai.io" class="hover:text-cyan-400 transition-colors">Emergency NOC Support</a>
          <span>•</span>
          <a routerLink="/login" class="hover:text-purple-400 transition-colors">Merchant Login</a>
        </div>
      </footer>
    </div>
  `,
})
export class MaintenanceComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private router = inject(Router);

  readonly maintenanceConfig = this.adminService.maintenanceConfig;
  readonly incidentId = Math.floor(100000 + Math.random() * 900000);

  isChecking = false;
  private timerInterval: any;

  countdown = signal<{ hours: string; minutes: string; seconds: string; millis: string }>({
    hours: '00',
    minutes: '45',
    seconds: '00',
    millis: '00',
  });

  ngOnInit(): void {
    this.adminService.fetchPublicMaintenanceStatus().subscribe();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private startCountdown(): void {
    let targetTime = Date.now() + 45 * 60 * 1000;
    const cfg = this.maintenanceConfig();
    if (cfg?.estimated_end_time) {
      targetTime = new Date(cfg.estimated_end_time).getTime();
    }

    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const millis = Math.floor((diff % 1000) / 10);

      this.countdown.set({
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
        millis: millis.toString().padStart(2, '0'),
      });
    }, 50);
  }

  checkStatus(): void {
    this.isChecking = true;
    this.adminService.fetchPublicMaintenanceStatus().subscribe({
      next: (cfg) => {
        this.isChecking = false;
        if (!cfg.is_active) {
          this.router.navigate(['/']);
        }
      },
      error: () => {
        this.isChecking = false;
      },
    });
  }
}
