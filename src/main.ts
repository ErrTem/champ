import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideServiceWorker } from '@angular/service-worker';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  arrowForwardOutline,
  calendarClearOutline,
  calendarOutline,
  cardOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  compassOutline,
  filterOutline,
  fitnessOutline,
  locationOutline,
  lockClosedOutline,
  moonOutline,
  partlySunnyOutline,
  personOutline,
  shieldCheckmarkOutline,
  shieldOutline,
  sunnyOutline,
  timeOutline,
} from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { environment } from './environments/environment';

addIcons({
  'arrow-back-outline': arrowBackOutline,
  'arrow-forward-outline': arrowForwardOutline,
  'card-outline': cardOutline,
  'compass-outline': compassOutline,
  'calendar-outline': calendarOutline,
  'calendar-clear-outline': calendarClearOutline,
  'fitness-outline': fitnessOutline,
  'location-outline': locationOutline,
  'lock-closed-outline': lockClosedOutline,
  'time-outline': timeOutline,
  'person-outline': personOutline,
  'shield-outline': shieldOutline,
  'shield-checkmark-outline': shieldCheckmarkOutline,
  'filter-outline': filterOutline,
  'chevron-down-outline': chevronDownOutline,
  'chevron-back-outline': chevronBackOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'sunny-outline': sunnyOutline,
  'partly-sunny-outline': partlySunnyOutline,
  'moon-outline': moonOutline,
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
