import { environment } from '../../../environments/environment';

/** Base URL for API calls (dev proxy `/api` or absolute origin). */
export function apiUrl(): string {
  return environment.apiUrl;
}
