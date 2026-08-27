import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { MaintenanceBannerComponent } from './layout/maintenance-banner/maintenance-banner.component';
import { AdminService } from './core/services/admin.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MaintenanceBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'VigilAI';
  private adminService = inject(AdminService);
  private router = inject(Router);
  private checkInterval: any;

  ngOnInit() {
    this.checkMaintenanceGate();

    // Check on navigation
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkMaintenanceGate();
    });

    // Background interval check every 12s
    this.checkInterval = setInterval(() => {
      this.adminService.fetchPublicMaintenanceStatus().subscribe({
        next: () => this.checkMaintenanceGate(),
        error: () => {}
      });
    }, 12000);
  }

  ngOnDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private checkMaintenanceGate() {
    const isMaintenance = this.adminService.isMaintenanceActive();
    const isAdmin = this.adminService.isAuthenticated();
    const currentUrl = this.router.url;

    if (isMaintenance && !isAdmin) {
      if (currentUrl.startsWith('/app') || currentUrl === '/login' || currentUrl === '/signup') {
        this.router.navigate(['/maintenance']);
      }
    }
  }
}
