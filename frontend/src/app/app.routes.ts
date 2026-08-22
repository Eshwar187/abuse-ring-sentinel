import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transactions.component').then(
            (m) => m.TransactionsComponent
          ),
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
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
