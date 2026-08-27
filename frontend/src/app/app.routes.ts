import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { authGuard, unauthGuard } from './core/guards/auth.guard';
import { adminGuard, adminUnauthGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Public Landing Page
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        (m) => m.LandingPageComponent
      ),
    pathMatch: 'full',
  },

  // Dedicated Public Maintenance Page
  {
    path: 'maintenance',
    loadComponent: () =>
      import('./features/maintenance/maintenance.component').then(
        (m) => m.MaintenanceComponent
      ),
  },

  // Central SuperAdmin Gateway & Command Center
  {
    path: 'admin/login',
    canActivate: [adminUnauthGuard],
    loadComponent: () =>
      import('./features/admin/admin-login.component').then(
        (m) => m.AdminLoginComponent
      ),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
  },
  {
    path: 'admin/dashboard',
    redirectTo: 'admin',
    pathMatch: 'full',
  },

  // Public Demo Environment (Historical Evaluation Benchmark)
  {
    path: 'demo',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/demo/demo.component').then(
            (m) => m.DemoComponent
          ),
      },
    ],
  },

  // Authentication Flows
  {
    path: 'login',
    canActivate: [unauthGuard],
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    canActivate: [unauthGuard],
    loadComponent: () =>
      import('./features/auth/signup.component').then(
        (m) => m.SignupComponent
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./features/onboarding/onboarding.component').then(
        (m) => m.OnboardingComponent
      ),
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./features/legal/terms.component').then((m) => m.TermsComponent),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./features/legal/privacy.component').then(
        (m) => m.PrivacyComponent
      ),
  },

  // Authenticated Merchant App Routes (/app/*)
  {
    path: 'app',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/overview/overview.component').then(
            (m) => m.LiveOverviewComponent
          ),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import(
            './features/transactions/live-transactions.component'
          ).then((m) => m.LiveTransactionsComponent),
      },
      {
        path: 'transactions/:id',
        loadComponent: () =>
          import(
            './features/transactions/transaction-detail.component'
          ).then((m) => m.TransactionDetailComponent),
      },
      {
        path: 'risk-analyzer',
        loadComponent: () =>
          import('./features/risk-analyzer/risk-analyzer.component').then(
            (m) => m.RiskAnalyzerComponent
          ),
      },
      {
        path: 'risk-networks',
        loadComponent: () =>
          import('./features/risk-networks/risk-networks.component').then(
            (m) => m.RiskNetworksComponent
          ),
      },
      {
        path: 'monitoring',
        loadComponent: () =>
          import('./features/monitoring/monitoring.component').then(
            (m) => m.MonitoringComponent
          ),
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./features/audit/audit.component').then(
            (m) => m.AuditComponent
          ),
      },
      {
        path: 'integration',
        loadComponent: () =>
          import('./features/integration/integration.component').then(
            (m) => m.IntegrationComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
    ],
  },

  // Legacy route compatibility redirects
  { path: 'dashboard', redirectTo: 'app/overview' },
  { path: 'transactions', redirectTo: 'app/transactions' },
  { path: 'risk-analyzer', redirectTo: 'app/risk-analyzer' },
  { path: 'risk-networks', redirectTo: 'app/risk-networks' },
  { path: 'monitoring', redirectTo: 'app/monitoring' },
  { path: 'audit', redirectTo: 'app/audit' },
  { path: 'integration', redirectTo: 'app/integration' },

  // Fallback
  {
    path: '**',
    redirectTo: '',
  },
];
