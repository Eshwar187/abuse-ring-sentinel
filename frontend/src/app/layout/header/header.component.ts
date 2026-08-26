import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { HealthService } from '../../core/services/health.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="h-16 bg-[#060A14] border-b border-slate-800/80 px-6 flex items-center justify-between text-slate-300 font-sans z-20 select-none">
      <!-- Left Search Bar -->
      <div class="flex-1 max-w-md mr-4">
        <div class="relative flex items-center">
          <svg class="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search transactions, users, devices..."
            class="w-full bg-[#0B132B] border border-slate-800 hover:border-slate-700 rounded-xl pl-10 pr-12 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-all font-sans"
          />
          <kbd class="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-700 rounded">⌘K</kbd>
        </div>
      </div>

      <!-- Right Telemetry Pills & User Profile -->
      <div class="flex items-center gap-3">
        <!-- System Status Pill -->
        <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-medium text-emerald-300 font-mono">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>System Status: <strong class="text-emerald-300 font-semibold">Operational</strong></span>
        </div>

        <!-- Model F Status Pill -->
        <div class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-[11px] font-medium text-purple-300 font-mono">
          <svg class="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Model F (τ = 0.90): <strong class="text-purple-200 font-semibold">Protected</strong></span>
        </div>

        <!-- Cloud MySQL Pill -->
        <div class="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-medium text-cyan-300 font-mono">
          <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <span>Cloud MySQL: <strong class="text-cyan-200 font-semibold">Connected</strong></span>
        </div>

        <!-- Notification Bell with Badge 6 -->
        <button
          type="button"
          class="relative p-2 rounded-xl bg-[#0B132B] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Notifications"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center font-mono">
            6
          </span>
        </button>

        <!-- Light/Dark Mode Icon -->
        <button
          type="button"
          class="p-2 rounded-xl bg-[#0B132B] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Toggle Light/Dark Theme"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>

        <!-- User Profile Dropdown Pill -->
        <div class="flex items-center gap-2.5 pl-2">
          <div class="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center text-xs font-bold font-mono">
            {{ auth.currentUser()?.company_name?.charAt(0) || 'E' }}
          </div>
          <div class="hidden xl:block text-left">
            <div class="text-xs font-bold text-white leading-tight">
              {{ auth.currentUser()?.company_name || 'Enterprise' }}
            </div>
            <div class="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
              {{ auth.currentUser()?.email || 'eshwar@enterprise.com' }}
            </div>
          </div>
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  auth = inject(AuthService);
  health = inject(HealthService);
}
