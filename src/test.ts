// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  arrowForwardOutline,
  calendarClearOutline,
  calendarOutline,
  cardOutline,
  compassOutline,
  fitnessOutline,
  locationOutline,
  lockClosedOutline,
  personOutline,
  shieldCheckmarkOutline,
  shieldOutline,
} from 'ionicons/icons';

addIcons({
  'arrow-back-outline': arrowBackOutline,
  'arrow-forward-outline': arrowForwardOutline,
  'calendar-clear-outline': calendarClearOutline,
  'calendar-outline': calendarOutline,
  'card-outline': cardOutline,
  'compass-outline': compassOutline,
  'fitness-outline': fitnessOutline,
  'location-outline': locationOutline,
  'lock-closed-outline': lockClosedOutline,
  'person-outline': personOutline,
  'shield-outline': shieldOutline,
  'shield-checkmark-outline': shieldCheckmarkOutline,
});

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
