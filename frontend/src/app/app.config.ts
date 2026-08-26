import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { LUCIDE_ICONS, LucideIconProvider, icons } from 'lucide-angular';

import { routes } from './app.routes';

// Build a casing-tolerant icon map (supporting kebab-case, camelCase, PascalCase)
const allIcons: Record<string, any> = {};
for (const [key, val] of Object.entries(icons)) {
  allIcons[key] = val;
  allIcons[key.toLowerCase()] = val;
  const kebab = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  allIcons[kebab] = val;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(allIcons) },
  ],
};
