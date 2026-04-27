import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideServiceWorker } from '@angular/service-worker';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  compassOutline,
  filterOutline,
  moonOutline,
  partlySunnyOutline,
  personOutline,
  shieldCheckmarkOutline,
  sunnyOutline,
  timeOutline,
} from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { environment } from './environments/environment';

addIcons({
  compassOutline,
  calendarOutline,
  timeOutline,
  personOutline,
  shieldCheckmarkOutline,
  filterOutline,
  chevronDownOutline,
  chevronBackOutline,
  chevronForwardOutline,
  sunnyOutline,
  partlySunnyOutline,
  moonOutline,
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ swipeBackEnabled: true }),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideServiceWorker('combined-sw.js', { enabled: environment.production }),
  ],
});
