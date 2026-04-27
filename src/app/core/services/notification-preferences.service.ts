import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type NotificationPreferences = {
  remindersEnabled: boolean;
  fighterNewBookingEnabled: boolean;
};

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.baseUrl}/notifications/preferences`, {
      withCredentials: true,
    });
  }

  updatePreferences(patch: Partial<NotificationPreferences>): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.baseUrl}/notifications/preferences`, patch, {
      withCredentials: true,
    });
  }
}

