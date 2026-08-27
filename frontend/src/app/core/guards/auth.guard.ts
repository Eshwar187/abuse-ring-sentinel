import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminService } from '../services/admin.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const adminService = inject(AdminService);
  const router = inject(Router);

  // If Maintenance mode is active, block regular merchant app access
  if (adminService.isMaintenanceActive() && !adminService.isAuthenticated()) {
    return router.createUrlTree(['/maintenance']);
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login with return url
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

export const unauthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const adminService = inject(AdminService);
  const router = inject(Router);

  // If Maintenance mode is active, redirect login/signup attempts to /maintenance
  if (adminService.isMaintenanceActive() && !adminService.isAuthenticated()) {
    return router.createUrlTree(['/maintenance']);
  }

  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/app/overview']);
  }
  return true;
};

