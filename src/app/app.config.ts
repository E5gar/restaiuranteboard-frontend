import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { ThemeService } from './services/theme.service';

function initThemeFactory(theme: ThemeService) {
  return () => {
    theme.initSync();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initThemeFactory,
      deps: [ThemeService],
      multi: true,
    },
  ],
};