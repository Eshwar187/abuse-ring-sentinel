import { Component, inject, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HealthService } from '../../core/services/health.service';
import { ApiService } from '../../core/services/api.service';
import { FormsModule } from '@angular/forms';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  read: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <header class="h-16 bg-[#060A14] border-b border-slate-800/80 px-6 flex items-center justify-between text-slate-300 font-sans z-30 select-none relative">
      <!-- Left Search Bar / Command Palette Trigger -->
      <div class="flex-1 max-w-md mr-4">
        <div
          (click)="showCommandPalette.set(true)"
          class="relative flex items-center cursor-pointer group"
        >
          <svg class="w-4 h-4 text-slate-500 group-hover:text-cyan-400 absolute left-3.5 pointer-events-none transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            readonly
            placeholder="Search transactions, entity graphs, rules..."
            class="w-full bg-[#0B132B] border border-slate-800 group-hover:border-cyan-500/50 rounded-xl pl-10 pr-12 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all font-sans cursor-pointer shadow-inner"
          />
          <kbd class="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-700 rounded shadow-sm">⌘K</kbd>
        </div>
      </div>

      <!-- Right Telemetry Pills & User Profile -->
      <div class="flex items-center gap-3">
        <!-- System Status Pill -->
        <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-medium text-emerald-300 font-mono shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>System Status: <strong class="text-emerald-300 font-semibold">Operational</strong></span>
        </div>

        <!-- Model F Status Pill -->
        <div class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-[11px] font-medium text-purple-300 font-mono shadow-sm">
          <svg class="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Model F (τ = 0.90): <strong class="text-purple-200 font-semibold">Protected</strong></span>
        </div>

        <!-- Cloud MySQL Pill -->
        <div class="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-medium text-cyan-300 font-mono shadow-sm">
          <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <span>Cloud MySQL: <strong class="text-cyan-200 font-semibold">Connected</strong></span>
        </div>

        <!-- Notification Bell with Interactive Tray -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleNotifications($event)"
            class="relative p-2 rounded-xl bg-[#0B132B] border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-white transition-all shadow-sm"
            title="Notifications & Alerts"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span *ngIf="unreadCount() > 0" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center font-mono animate-pulse shadow-sm">
              {{ unreadCount() }}
            </span>
          </button>

          <!-- Notifications Dropdown Tray -->
          <div
            *ngIf="showNotifications()"
            (click)="$event.stopPropagation()"
            class="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0B132B] border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in backdrop-blur-2xl"
          >
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-white">Live System Alerts</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold">{{ unreadCount() }} New</span>
              </div>
              <button
                type="button"
                (click)="markAllAsRead()"
                class="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
              >
                Mark all read
              </button>
            </div>

            <div class="divide-y divide-slate-800/60 max-h-72 overflow-y-auto my-2 space-y-1">
              <div
                *ngFor="let item of notifications()"
                class="py-2.5 px-2 rounded-xl transition-colors hover:bg-slate-900/60 cursor-pointer flex items-start gap-3"
                [class.opacity-60]="item.read"
              >
                <!-- Icon indicator -->
                <div
                  class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                  [ngClass]="{
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20': item.type === 'danger',
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20': item.type === 'warning',
                    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20': item.type === 'info',
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': item.type === 'success'
                  }"
                >
                  <span *ngIf="item.type === 'danger'">✕</span>
                  <span *ngIf="item.type === 'warning'">⚠</span>
                  <span *ngIf="item.type === 'info'">ℹ</span>
                  <span *ngIf="item.type === 'success'">✓</span>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="text-xs font-semibold text-slate-100 flex items-center justify-between">
                    <span class="truncate">{{ item.title }}</span>
                    <span class="text-[10px] text-slate-500 font-mono">{{ item.time }}</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{{ item.desc }}</p>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-800 text-center">
              <a
                routerLink="/app/alerts"
                (click)="showNotifications.set(false)"
                class="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors block py-1 font-mono"
              >
                View Full Alert Ledger (12) →
              </a>
            </div>
          </div>
        </div>

        <!-- Theme Accent Switcher Button -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleThemePicker($event)"
            class="p-2 rounded-xl bg-[#0B132B] border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-white transition-all shadow-sm"
            title="Cyber Theme Palette"
          >
            <svg class="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>

          <!-- Theme Palette Menu -->
          <div
            *ngIf="showThemeMenu()"
            (click)="$event.stopPropagation()"
            class="absolute right-0 mt-3 w-52 bg-[#0B132B] border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-fade-in backdrop-blur-2xl space-y-1.5"
          >
            <div class="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider px-2 py-1 flex items-center justify-between">
              <span>Cyber Accent</span>
              <span class="text-cyan-400 font-normal">Active: {{ currentTheme() }}</span>
            </div>

            <!-- Cyber Cyan -->
            <div
              (click)="setTheme('cyber')"
              class="p-2 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-all"
              [ngClass]="currentTheme() === 'cyber' ? 'bg-cyan-950/50 border border-cyan-500/40 text-white font-bold' : 'hover:bg-slate-900 text-slate-300 border border-transparent'"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
                <span>Cyber Cyan</span>
              </div>
              <span *ngIf="currentTheme() === 'cyber'" class="text-cyan-400 text-xs font-mono">✓</span>
            </div>

            <!-- Electric Purple -->
            <div
              (click)="setTheme('purple')"
              class="p-2 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-all"
              [ngClass]="currentTheme() === 'purple' ? 'bg-purple-950/50 border border-purple-500/40 text-white font-bold' : 'hover:bg-slate-900 text-slate-300 border border-transparent'"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
                <span>Electric Purple</span>
              </div>
              <span *ngIf="currentTheme() === 'purple'" class="text-purple-400 text-xs font-mono">✓</span>
            </div>

            <!-- Matrix Emerald -->
            <div
              (click)="setTheme('emerald')"
              class="p-2 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-all"
              [ngClass]="currentTheme() === 'emerald' ? 'bg-emerald-950/50 border border-emerald-500/40 text-white font-bold' : 'hover:bg-slate-900 text-slate-300 border border-transparent'"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                <span>Matrix Emerald</span>
              </div>
              <span *ngIf="currentTheme() === 'emerald'" class="text-emerald-400 text-xs font-mono">✓</span>
            </div>

            <!-- Solar Amber -->
            <div
              (click)="setTheme('amber')"
              class="p-2 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-all"
              [ngClass]="currentTheme() === 'amber' ? 'bg-amber-950/50 border border-amber-500/40 text-white font-bold' : 'hover:bg-slate-900 text-slate-300 border border-transparent'"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
                <span>Solar Amber</span>
              </div>
              <span *ngIf="currentTheme() === 'amber'" class="text-amber-400 text-xs font-mono">✓</span>
            </div>
          </div>
        </div>

        <!-- User Profile Dropdown Pill -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleProfileMenu($event)"
            class="flex items-center gap-2.5 pl-2 py-1 pr-1.5 rounded-xl hover:bg-[#0B132B] border border-transparent hover:border-slate-800 transition-all cursor-pointer"
          >
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-black flex items-center justify-center text-xs font-extrabold font-mono shadow-md shadow-cyan-500/20">
              {{ companyInitial() }}
            </div>
            <div class="hidden xl:block text-left">
              <div class="text-xs font-bold text-white leading-tight">
                {{ companyName() }}
              </div>
              <div class="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                {{ userEmail() }}
              </div>
            </div>
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Profile / Account Dropdown Menu -->
          <div
            *ngIf="showProfileMenu()"
            (click)="$event.stopPropagation()"
            class="absolute right-0 mt-3 w-64 bg-[#0B132B] border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in backdrop-blur-2xl space-y-3"
          >
            <!-- User Header -->
            <div class="pb-3 border-b border-slate-800">
              <div class="text-xs font-bold text-white">{{ auth.currentUser()?.full_name || companyName() }}</div>
              <div class="text-[11px] text-cyan-400 font-mono">{{ userEmail() }}</div>
              <div class="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-mono text-cyan-300">
                <span>Tenant: {{ auth.currentUser()?.merchant_id || 'tenant_prod_live' }}</span>
              </div>
            </div>

            <!-- Menu Navigation Links -->
            <div class="space-y-1 text-xs">
              <a
                routerLink="/app/settings"
                (click)="showProfileMenu.set(false)"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <span>⚙️ Merchant Settings</span>
              </a>
              <a
                routerLink="/app/integration"
                (click)="showProfileMenu.set(false)"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <span>🔌 API Keys & Webhooks</span>
              </a>
              <a
                routerLink="/demo"
                (click)="showProfileMenu.set(false)"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <span>▶ 6.9k Benchmark Studio</span>
              </a>
              <a
                routerLink="/admin"
                (click)="showProfileMenu.set(false)"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-purple-300 hover:text-purple-100 bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/30 transition-colors font-semibold"
              >
                <span>🛡️ Central Admin (SuperAdmin)</span>
              </a>
              <a
                routerLink="/maintenance"
                (click)="showProfileMenu.set(false)"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-300 hover:text-amber-100 hover:bg-slate-900 transition-colors"
              >
                <span>🛠️ System Maintenance Screen</span>
              </a>
            </div>

            <!-- Sign Out Action Button -->
            <div class="pt-2 border-t border-slate-800">
              <button
                type="button"
                (click)="onLogout()"
                class="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 border border-rose-500/20 transition-all"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out of Console</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Global Command Palette Modal (Ctrl+K / ⌘K) -->
    <div
      *ngIf="showCommandPalette()"
      (click)="showCommandPalette.set(false)"
      class="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-start justify-center pt-24 px-4 select-none animate-fade-in"
    >
      <div
        (click)="$event.stopPropagation()"
        class="bg-[#0B132B] border border-cyan-500/40 rounded-3xl w-full max-w-xl shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden"
      >
        <div class="p-4 border-b border-slate-800 flex items-center gap-3">
          <svg class="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="handleSearchJump()"
            placeholder="Type a command or search feature (e.g., live, graph, analyze, audit)..."
            class="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
            autofocus
          />
          <kbd (click)="showCommandPalette.set(false)" class="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-700 cursor-pointer">ESC</kbd>
        </div>

        <div class="p-3 max-h-80 overflow-y-auto space-y-1">
          <div class="text-[10px] font-mono text-slate-500 uppercase px-3 py-1 font-bold">Quick Navigation</div>
          <div
            *ngFor="let cmd of filteredCommands()"
            (click)="executeCommand(cmd.route)"
            class="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-cyan-950/40 hover:border hover:border-cyan-500/30 text-xs text-slate-200 cursor-pointer transition-all"
          >
            <div class="flex items-center gap-2.5">
              <span>{{ cmd.icon }}</span>
              <span class="font-semibold text-white">{{ cmd.title }}</span>
              <span class="text-slate-400 text-[11px]">{{ cmd.desc }}</span>
            </div>
            <kbd class="text-[10px] font-mono text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{{ cmd.shortcut }}</kbd>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class HeaderComponent implements OnInit {
  auth = inject(AuthService);
  health = inject(HealthService);
  api = inject(ApiService);
  router = inject(Router);

  readonly showNotifications = signal(false);
  readonly showProfileMenu = signal(false);
  readonly showThemeMenu = signal(false);
  readonly showCommandPalette = signal(false);
  readonly currentTheme = signal<string>('cyber');
  searchQuery = '';

  ngOnInit(): void {
    const saved = localStorage.getItem('vigilai_theme') || 'cyber';
    this.currentTheme.set(saved);
    this.applyThemeClass(saved);
  }

  readonly notifications = signal<NotificationItem[]>([
    { id: '1', title: 'Sybil Ring Detected', desc: 'Coordinated cluster of 5 devices sharing masked cards blocked.', time: '1m ago', type: 'danger', read: false },
    { id: '2', title: 'Velocity Anomaly', desc: 'User usr_9921 triggered 1h velocity limit (9 attempts).', time: '4m ago', type: 'warning', read: false },
    { id: '3', title: 'Model F Protection Active', desc: 'Inference batch cleared 42 inbound transactions.', time: '12m ago', type: 'success', read: false },
    { id: '4', title: 'Cloud MySQL Sync OK', desc: 'Aiven DB automated persistent snapshot completed.', time: '25m ago', type: 'info', read: true },
    { id: '5', title: 'New Device Fingerprint', desc: 'Device dev_881 linked to 3 prior checkout identities.', time: '45m ago', type: 'warning', read: true },
    { id: '6', title: 'Webhook Dispatched', desc: 'HMAC signed decision BLOCK sent to checkout gateway.', time: '1h ago', type: 'info', read: true },
  ]);

  readonly commands = [
    { title: 'Overview Dashboard', desc: 'Main HUD metrics & risk ledger', route: '/app/overview', icon: '📊', shortcut: 'O' },
    { title: 'Live Transactions', desc: 'Stream real-time checkout events', route: '/app/transactions', icon: '💳', shortcut: 'T' },
    { title: 'Risk Analyzer', desc: 'Interactive 33-feature prediction studio', route: '/app/risk-analyzer', icon: '⚡', shortcut: 'A' },
    { title: 'Entity Networks', desc: 'Cytoscape bipartite graph collusion', route: '/app/risk-networks', icon: '🕸️', shortcut: 'G' },
    { title: 'Alerts Ledger', desc: '12 Coordinated syndicate alerts', route: '/app/alerts', icon: '🚨', shortcut: 'L' },
    { title: 'Risk Monitor', desc: 'System telemetry & GBDT distributions', route: '/app/monitoring', icon: '📈', shortcut: 'M' },
    { title: 'Audit Log', desc: 'Historical compliance decisions', route: '/app/audit-log', icon: '📜', shortcut: 'D' },
    { title: 'Settings', desc: 'Merchant profile & threshold configs', route: '/app/settings', icon: '⚙️', shortcut: 'S' },
  ];

  filteredCommands() {
    if (!this.searchQuery) return this.commands;
    const q = this.searchQuery.toLowerCase();
    return this.commands.filter(c => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.showCommandPalette.update(v => !v);
    } else if (e.key === 'Escape') {
      this.showNotifications.set(false);
      this.showProfileMenu.set(false);
      this.showThemeMenu.set(false);
      this.showCommandPalette.set(false);
    }
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showNotifications.set(false);
    this.showProfileMenu.set(false);
    this.showThemeMenu.set(false);
  }

  toggleNotifications(e: MouseEvent) {
    e.stopPropagation();
    this.showProfileMenu.set(false);
    this.showThemeMenu.set(false);
    this.showNotifications.update(v => !v);
  }

  toggleProfileMenu(e: MouseEvent) {
    e.stopPropagation();
    this.showNotifications.set(false);
    this.showThemeMenu.set(false);
    this.showProfileMenu.update(v => !v);
  }

  toggleThemePicker(e: MouseEvent) {
    e.stopPropagation();
    this.showNotifications.set(false);
    this.showProfileMenu.set(false);
    this.showThemeMenu.update(v => !v);
  }

  unreadCount() {
    return this.notifications().filter(n => !n.read).length;
  }

  markAllAsRead() {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  setTheme(theme: string) {
    this.currentTheme.set(theme);
    localStorage.setItem('vigilai_theme', theme);
    this.applyThemeClass(theme);
    this.showThemeMenu.set(false);
  }

  private applyThemeClass(theme: string) {
    document.body.classList.remove('theme-cyber', 'theme-purple', 'theme-emerald', 'theme-amber');
    if (theme && theme !== 'cyber') {
      document.body.classList.add('theme-' + theme);
    }
  }

  companyName(): string {
    return this.auth.currentUser()?.company_name || 'Enterprise Merchant';
  }

  userEmail(): string {
    return this.auth.currentUser()?.email || 'admin@enterprise.com';
  }

  companyInitial(): string {
    return this.companyName().charAt(0).toUpperCase();
  }

  executeCommand(route: string) {
    this.showCommandPalette.set(false);
    this.router.navigateByUrl(route);
  }

  handleSearchJump() {
    const list = this.filteredCommands();
    if (list.length > 0) {
      this.executeCommand(list[0].route);
    }
  }

  onLogout() {
    this.showProfileMenu.set(false);
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
