import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between px-4 sm:px-8 py-6 font-sans relative overflow-hidden select-none">
      <!-- Ambient Laser Grid & Cyber Glow Backgrounds -->
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,119,198,0.25),transparent_70%),radial-gradient(ellipse_60%_50%_at_80%_60%,rgba(6,182,212,0.12),transparent_70%)] pointer-events-none"></div>
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#0B132B_1px,transparent_1px),linear-gradient(to_bottom,#0B132B_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none"></div>

      <!-- 1. Top Header / Brand Bar -->
      <header class="w-full max-w-7xl mx-auto flex items-center justify-between z-20 pb-4 border-b border-slate-800/60">
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-[0_0_25px_rgba(168,85,247,0.35)] flex items-center justify-center">
            <div class="w-full h-full bg-[#080D1A] rounded-2xl flex items-center justify-center">
              <svg class="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base font-extrabold tracking-tight text-white">VigilAI</span>
              <span class="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[9px] font-mono font-bold uppercase tracking-wider">
                CORE ENGINE
              </span>
            </div>
            <p class="text-[10px] text-slate-400 font-mono tracking-wide">Autonomous Abuse-Ring Sentinel</p>
          </div>
        </div>

        <!-- Right Header Actions -->
        <div class="flex items-center gap-3">
          <div class="px-3 py-1.5 rounded-full bg-[#0B132B]/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2 shadow-inner">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>System Status</span>
          </div>

          <a
            routerLink="/admin/login"
            class="px-4 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 hover:border-purple-400 text-purple-200 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Admin Access</span>
          </a>
        </div>
      </header>

      <!-- 2. Main Center Section (Two Columns) -->
      <main class="w-full max-w-7xl mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center z-10">
        <!-- Left Column: Notice & Countdown -->
        <div class="lg:col-span-6 space-y-6 text-left">
          <!-- Scheduled Maintenance Pill -->
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <span>🔧</span>
            <span class="uppercase tracking-wider">SCHEDULED MAINTENANCE</span>
          </div>

          <!-- Main Title -->
          <h1 class="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Core Engine <br />
            <span class="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Upgrade in Progress
            </span>
          </h1>

          <!-- Subtitle Description -->
          <p class="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg font-sans">
            We're upgrading the VigilAI Core Engine to deliver stronger fraud detection, improved accuracy, and enterprise-grade performance.
          </p>

          <!-- Safe Data Callout -->
          <div class="p-3.5 rounded-2xl bg-[#060A14]/90 border border-slate-800/90 shadow-xl flex items-center gap-3 max-w-lg">
            <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div class="text-xs text-slate-300 leading-snug">
              <span class="text-white font-semibold">Your data is safe.</span> <span class="text-emerald-400 font-semibold">Real-time fraud protection remains active.</span>
            </div>
          </div>

          <!-- Estimated Completion Countdown Box -->
          <div class="p-6 rounded-3xl bg-[#0B132B]/85 border border-purple-500/30 shadow-2xl backdrop-blur-xl space-y-3 max-w-lg">
            <div class="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center justify-between">
              <span>ESTIMATED COMPLETION</span>
              <span class="text-cyan-400 font-bold">Auto-Resuming</span>
            </div>

            <div class="grid grid-cols-4 gap-2.5 text-center">
              <div class="p-3 rounded-2xl bg-[#030712] border border-slate-800/90 shadow-inner">
                <div class="text-2xl sm:text-3xl font-black font-mono text-cyan-400 tracking-tight">{{ countdown().hours }}</div>
                <div class="text-[9px] uppercase font-mono text-slate-500 mt-1 font-bold">HOURS</div>
              </div>
              <div class="p-3 rounded-2xl bg-[#030712] border border-slate-800/90 shadow-inner">
                <div class="text-2xl sm:text-3xl font-black font-mono text-indigo-400 tracking-tight">{{ countdown().minutes }}</div>
                <div class="text-[9px] uppercase font-mono text-slate-500 mt-1 font-bold">MINUTES</div>
              </div>
              <div class="p-3 rounded-2xl bg-[#030712] border border-slate-800/90 shadow-inner">
                <div class="text-2xl sm:text-3xl font-black font-mono text-purple-400 tracking-tight">{{ countdown().seconds }}</div>
                <div class="text-[9px] uppercase font-mono text-slate-500 mt-1 font-bold">SECONDS</div>
              </div>
              <div class="p-3 rounded-2xl bg-[#030712] border border-purple-500/30 shadow-inner">
                <div class="text-2xl sm:text-3xl font-black font-mono text-pink-400 tracking-tight animate-pulse">{{ countdown().millis }}</div>
                <div class="text-[9px] uppercase font-mono text-pink-400/80 mt-1 font-bold">MILLISECONDS</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Holographic 3D Shield Reactor & Orbiting Nodes -->
        <div class="lg:col-span-6 relative flex items-center justify-center min-h-[420px]">
          <!-- Concentric Laser Orbit Rings -->
          <div class="absolute w-80 sm:w-96 h-80 sm:h-96 rounded-full border border-purple-500/20 animate-[spin_25s_linear_infinite] pointer-events-none"></div>
          <div class="absolute w-64 sm:w-72 h-64 sm:h-72 rounded-full border border-dashed border-cyan-500/25 animate-[spin_18s_linear_infinite_reverse] pointer-events-none"></div>
          <div class="absolute w-48 sm:w-56 h-48 sm:h-56 rounded-full border border-indigo-500/30 animate-pulse pointer-events-none"></div>

          <!-- Central Illuminated 3D Shield Pedestal -->
          <div class="relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-tr from-purple-900/80 via-[#0B132B] to-cyan-950/80 border-2 border-cyan-400/60 shadow-[0_0_60px_rgba(6,182,212,0.4)] flex flex-col items-center justify-center backdrop-blur-2xl group">
            <div class="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-purple-500/20 rounded-3xl animate-pulse pointer-events-none"></div>
            <!-- Large Shield SVG -->
            <svg class="w-18 h-18 text-cyan-300 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.9)] animate-bounce-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div class="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider mt-1">Core Online</div>
          </div>

          <!-- Floating Orbit Node 1: Top-Left (Database Optimization) -->
          <div class="absolute -top-4 -left-2 sm:left-4 z-20 p-2.5 sm:p-3 rounded-2xl bg-[#0B132B]/90 border border-cyan-500/40 shadow-xl backdrop-blur-xl flex items-center gap-2.5 animate-float-slow">
            <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-bold text-white">Database Optimization</div>
              <div class="text-[9px] text-slate-400 font-mono">Indexing & performance</div>
            </div>
          </div>

          <!-- Floating Orbit Node 2: Top-Right (Model Calibration) -->
          <div class="absolute -top-4 -right-2 sm:right-4 z-20 p-2.5 sm:p-3 rounded-2xl bg-[#0B132B]/90 border border-purple-500/40 shadow-xl backdrop-blur-xl flex items-center gap-2.5 animate-float-reverse">
            <div class="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-bold text-white">Model Calibration</div>
              <div class="text-[9px] text-slate-400 font-mono">Fine-tuning ML models</div>
            </div>
          </div>

          <!-- Floating Orbit Node 3: Bottom-Left (Engine Upgrade - Active) -->
          <div class="absolute -bottom-4 -left-2 sm:left-4 z-20 p-2.5 sm:p-3 rounded-2xl bg-[#0B132B]/90 border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.25)] backdrop-blur-xl flex items-center gap-2.5 animate-float-slow">
            <div class="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              <svg class="w-4 h-4 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-bold text-indigo-200">Engine Upgrade</div>
              <div class="text-[9px] text-slate-400 font-mono">Deploying new core</div>
            </div>
          </div>

          <!-- Floating Orbit Node 4: Bottom-Right (Integrity Verification) -->
          <div class="absolute -bottom-4 -right-2 sm:right-4 z-20 p-2.5 sm:p-3 rounded-2xl bg-[#0B132B]/90 border border-emerald-500/40 shadow-xl backdrop-blur-xl flex items-center gap-2.5 animate-float-reverse">
            <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-bold text-white">Integrity Verification</div>
              <div class="text-[9px] text-slate-400 font-mono">Security & consistency</div>
            </div>
          </div>

          <!-- Floating Orbit Node 5: Mid-Right (Pre-Upgrade Checks) -->
          <div class="hidden xl:flex absolute top-1/2 -translate-y-1/2 -right-12 z-20 p-2.5 rounded-2xl bg-[#0B132B]/90 border border-cyan-500/30 shadow-xl backdrop-blur-xl items-center gap-2 animate-pulse">
            <div class="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div class="text-left">
              <div class="text-[11px] font-bold text-white">Pre-Upgrade Checks</div>
              <div class="text-[8px] text-slate-400 font-mono">System diagnostics</div>
            </div>
          </div>
        </div>
      </main>

      <!-- 3. Bottom Section: Upgrade Pipeline & What This Upgrade Includes -->
      <section class="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 z-10 pt-4">
        <!-- Upgrade Pipeline Stepper (Left 6 Cols) -->
        <div class="lg:col-span-6 p-6 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-xl space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">UPGRADE PIPELINE</span>
            <span class="text-[10px] font-mono text-purple-400 font-semibold">Phase 3 of 5</span>
          </div>

          <!-- 5-Step Pipeline Progress Bar -->
          <div class="grid grid-cols-5 gap-2 items-start text-center">
            <!-- Step 1: Completed -->
            <div class="space-y-1.5 flex flex-col items-center">
              <div class="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                ✓
              </div>
              <div class="text-[10px] font-bold text-slate-200">Pre-Checks</div>
              <div class="text-[8px] text-emerald-400 font-mono font-semibold">Completed</div>
            </div>

            <!-- Step 2: Completed -->
            <div class="space-y-1.5 flex flex-col items-center">
              <div class="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                ✓
              </div>
              <div class="text-[10px] font-bold text-slate-200">Calibration</div>
              <div class="text-[8px] text-emerald-400 font-mono font-semibold">Completed</div>
            </div>

            <!-- Step 3: In Progress (Active Glowing) -->
            <div class="space-y-1.5 flex flex-col items-center relative">
              <div class="w-8 h-8 rounded-full bg-purple-600 border-2 border-purple-400 text-white flex items-center justify-center text-xs font-black shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse">
                3
              </div>
              <div class="text-[10px] font-bold text-purple-200">Engine Upgrade</div>
              <div class="text-[8px] text-purple-400 font-mono font-bold animate-pulse">In Progress</div>
            </div>

            <!-- Step 4: Pending -->
            <div class="space-y-1.5 flex flex-col items-center opacity-60">
              <div class="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-slate-400 flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div class="text-[10px] font-semibold text-slate-400">DB Optimize</div>
              <div class="text-[8px] text-slate-500 font-mono">Pending</div>
            </div>

            <!-- Step 5: Pending -->
            <div class="space-y-1.5 flex flex-col items-center opacity-60">
              <div class="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-slate-400 flex items-center justify-center text-xs font-bold">
                5
              </div>
              <div class="text-[10px] font-semibold text-slate-400">Verification</div>
              <div class="text-[8px] text-slate-500 font-mono">Pending</div>
            </div>
          </div>
        </div>

        <!-- What This Upgrade Includes (Right 6 Cols) -->
        <div class="lg:col-span-6 p-6 rounded-3xl bg-[#0B132B]/85 border border-slate-800/90 shadow-2xl backdrop-blur-xl space-y-3">
          <div class="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            WHAT THIS UPGRADE INCLUDES
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="p-3 rounded-2xl bg-[#030712]/90 border border-slate-800/80 flex items-start gap-2.5">
              <span class="text-base">🧠</span>
              <div>
                <div class="font-bold text-white">Advanced ML Models</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Next-gen detection accuracy</div>
              </div>
            </div>

            <div class="p-3 rounded-2xl bg-[#030712]/90 border border-slate-800/80 flex items-start gap-2.5">
              <span class="text-base">⚡</span>
              <div>
                <div class="font-bold text-white">Faster Risk Processing</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Low latency risk engine</div>
              </div>
            </div>

            <div class="p-3 rounded-2xl bg-[#030712]/90 border border-slate-800/80 flex items-start gap-2.5">
              <span class="text-base">🔒</span>
              <div>
                <div class="font-bold text-white">Stronger Data Protection</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Encrypted & secure pipeline</div>
              </div>
            </div>

            <div class="p-3 rounded-2xl bg-[#030712]/90 border border-slate-800/80 flex items-start gap-2.5">
              <span class="text-base">🛡️</span>
              <div>
                <div class="font-bold text-white">Zero Downtime</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Seamless background upgrade</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Footer -->
      <footer class="w-full max-w-7xl mx-auto text-center z-10 pt-6 pb-2 text-xs font-mono text-slate-400 flex items-center justify-center gap-1.5">
        <span>💜</span>
        <span>Thank you for your patience. We're building the future of fraud intelligence.</span>
      </footer>
    </div>
  `,
  styles: [`
    @keyframes floatSlow {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    @keyframes floatReverse {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(8px); }
    }
    @keyframes bounceSlow {
      0%, 100% { transform: translateY(0px) scale(1); }
      50% { transform: translateY(-4px) scale(1.03); }
    }
    .animate-float-slow {
      animation: floatSlow 5s ease-in-out infinite;
    }
    .animate-float-reverse {
      animation: floatReverse 6s ease-in-out infinite;
    }
    .animate-bounce-slow {
      animation: bounceSlow 3.5s ease-in-out infinite;
    }
  `]
})
export class MaintenanceComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private router = inject(Router);

  private timerInterval: any;
  private statusInterval: any;

  // Target remaining seconds (default 2h 37m 19s)
  private remainingTotalSeconds = 2 * 3600 + 37 * 60 + 19;
  private currentMillis = 48;

  readonly countdown = signal<{
    hours: string;
    minutes: string;
    seconds: string;
    millis: string;
  }>({
    hours: '02',
    minutes: '37',
    seconds: '19',
    millis: '48',
  });

  ngOnInit(): void {
    this.startCountdownTicker();

    // Poll status: If maintenance is turned off, automatically redirect users back to the app!
    this.statusInterval = setInterval(() => {
      this.adminService.fetchPublicMaintenanceStatus().subscribe({
        next: (status) => {
          if (!status.is_active) {
            this.router.navigate(['/app/overview']);
          }
        },
        error: () => {}
      });
    }, 8000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.statusInterval) clearInterval(this.statusInterval);
  }

  private startCountdownTicker() {
    this.timerInterval = setInterval(() => {
      // Rapid millisecond ticker
      this.currentMillis -= 3;
      if (this.currentMillis <= 0) {
        this.currentMillis = 99;
        this.remainingTotalSeconds = Math.max(0, this.remainingTotalSeconds - 1);
      }

      const h = Math.floor(this.remainingTotalSeconds / 3600);
      const m = Math.floor((this.remainingTotalSeconds % 3600) / 60);
      const s = this.remainingTotalSeconds % 60;

      this.countdown.set({
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0'),
        millis: this.currentMillis.toString().padStart(2, '0'),
      });
    }, 30);
  }
}
