import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type FighterSelfScheduleRule = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  active: boolean;
};

export type FighterSelfService = {
  id: string;
  fighterId: string;
  title: string;
  durationMinutes: number;
  modality: string;
  priceCents: number;
  currency: string;
  published: boolean;
};

export type FighterSelfBookingListItem = {
  id: string;
  status: string;
  startsAtUtc: string;
  endsAtUtc: string;
  user: { id: string; email: string; name: string | null };
  service: { id: string; title: string; priceCents: number; currency: string };
};

@Injectable({ providedIn: 'root' })
export class FighterSelfApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getScheduleRules(): Observable<FighterSelfScheduleRule[]> {
    return this.http.get<FighterSelfScheduleRule[]>(`${this.baseUrl}/fighter-self/schedule-rules`, {
      withCredentials: true,
    });
  }

  replaceScheduleRules(rules: FighterSelfScheduleRule[]): Observable<{ ok: true }> {
    return this.http.put<{ ok: true }>(
      `${this.baseUrl}/fighter-self/schedule-rules`,
      { rules },
      { withCredentials: true },
    );
  }

  listServices(): Observable<FighterSelfService[]> {
    return this.http.get<FighterSelfService[]>(`${this.baseUrl}/fighter-self/services`, {
      withCredentials: true,
    });
  }

  createService(payload: {
    title: string;
    durationMinutes: number;
    modality: 'online' | 'in_person';
    priceCents: number;
    currency?: string;
    published?: boolean;
  }): Observable<FighterSelfService> {
    return this.http.post<FighterSelfService>(`${this.baseUrl}/fighter-self/services`, payload, {
      withCredentials: true,
    });
  }

  updateService(
    serviceId: string,
    patch: {
      title?: string;
      durationMinutes?: number;
      modality?: 'online' | 'in_person';
      priceCents?: number;
      currency?: string;
      published?: boolean;
    },
  ): Observable<FighterSelfService> {
    return this.http.patch<FighterSelfService>(
      `${this.baseUrl}/fighter-self/services/${encodeURIComponent(serviceId)}`,
      patch,
      { withCredentials: true },
    );
  }

  listBookings(): Observable<FighterSelfBookingListItem[]> {
    return this.http.get<FighterSelfBookingListItem[]>(`${this.baseUrl}/fighter-self/bookings`, {
      withCredentials: true,
    });
  }

  cancelBooking(bookingId: string, payload?: { note?: string }): Observable<{ ok: true }> {
    return this.http.post<{ ok: true }>(
      `${this.baseUrl}/fighter-self/bookings/${encodeURIComponent(bookingId)}/cancel`,
      payload ?? {},
      { withCredentials: true },
    );
  }
}

