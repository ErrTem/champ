// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { addIcons } from 'ionicons';
import {
  calendarClearOutline,
  calendarOutline,
  compassOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';

addIcons({
  'calendar-clear-outline': calendarClearOutline,
  'calendar-outline': calendarOutline,
  'compass-outline': compassOutline,
  'person-outline': personOutline,
  'shield-checkmark-outline': shieldCheckmarkOutline,
});

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
