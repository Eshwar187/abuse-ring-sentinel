import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MaintenanceBannerComponent } from './layout/maintenance-banner/maintenance-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MaintenanceBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'VigilAI';
}
