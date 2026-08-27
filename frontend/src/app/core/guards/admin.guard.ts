import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';

export const adminGuard: CanActivateFn = () => {
  const adminService = inject(AdminService);
  const router = inject(Router);

  if (adminService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/admin/login']);
  return false;
};

export const adminUnauthGuard: CanActivateFn = () => {
  const adminService = inject(AdminService);
  const router = inject(Router);

  if (adminService.isAuthenticated()) {
    router.navigate(['/admin']);
    return false;
  }

  return true;
};
