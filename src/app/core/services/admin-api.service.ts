import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AdminFighter = {
  id: string;
  name: string;
  summary: string;
  bio: string;
  photoUrl: string | null;
  disciplines: string[];
  published: boolean;
};

export type AdminScheduleRule = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  active: boolean;
};

export type AdminService = {
  id: string;
  fighterId: string;
  title: string;
  durationMinutes: number;
  modality: string;
  priceCents: number;
  currency: string;
  published: boolean;
};

export type AdminBookingListItem = {
  id: string;
  status: string;
  startsAtUtc: string;
  fighter: { id: string; name: string };
  service: { id: string; title: string; priceCents: number; currency: string };
  user: { id: string; email: string; name: string | null };
};

export type AdminBookingDetail = AdminBookingListItem;

export type AdminFighterApprovalUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  fighterStatus: string;
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  listFighters(): Observable<AdminFighter[]> {
    return this.http.get<AdminFighter[]>(`${this.baseUrl}/admin/fighters`, { withCredentials: true });
  }

  createFighter(payload: {
    name: string;
    summary?: string;
    bio?: string;
    photoUrl?: string;
    disciplines?: string[];
    published?: boolean;
  }): Observable<AdminFighter> {
    return this.http.post<AdminFighter>(`${this.baseUrl}/admin/fighters`, payload, {
      withCredentials: true,
    });
  }

  updateFighter(
    fighterId: string,
    patch: {
      name?: string;
      summary?: string;
      bio?: string;
      photoUrl?: string;
      disciplines?: string[];
      published?: boolean;
    },
  ): Observable<AdminFighter> {
    return this.http.patch<AdminFighter>(
      `${this.baseUrl}/admin/fighters/${encodeURIComponent(fighterId)}`,
      patch,
      { withCredentials: true },
    );
  }

  listFighterServices(fighterId: string): Observable<AdminService[]> {
    return this.http.get<AdminService[]>(
      `${this.baseUrl}/admin/fighters/${encodeURIComponent(fighterId)}/services`,
      { withCredentials: true },
    );
  }

  createFighterService(
    fighterId: string,
    payload: {
      title: string;
      durationMinutes: number;
      modality: 'online' | 'in_person';
      priceCents: number;
      currency?: string;
      published?: boolean;
    },
  ): Observable<AdminService> {
    return this.http.post<AdminService>(
      `${this.baseUrl}/admin/fighters/${encodeURIComponent(fighterId)}/services`,
      payload,
      { withCredentials: true },
    );
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
  ): Observable<AdminService> {
    return this.http.patch<AdminService>(
      `${this.baseUrl}/admin/services/${encodeURIComponent(serviceId)}`,
      patch,
      { withCredentials: true },
    );
  }

  getScheduleRules(fighterId: string): Observable<AdminScheduleRule[]> {
    return this.http.get<AdminScheduleRule[]>(
      `${this.baseUrl}/admin/fighters/${encodeURIComponent(fighterId)}/schedule-rules`,
      { withCredentials: true },
    );
  }

  replaceScheduleRules(fighterId: string, rules: AdminScheduleRule[]): Observable<{ ok: true }> {
    return this.http.put<{ ok: true }>(
      `${this.baseUrl}/admin/fighters/${encodeURIComponent(fighterId)}/schedule-rules`,
      { rules },
      { withCredentials: true },
    );
  }

  listBookings(filters: {
    status?: string;
    fighterId?: string;
    from?: string;
    to?: string;
  }): Observable<AdminBookingListItem[]> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.fighterId) params = params.set('fighterId', filters.fighterId);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);

    return this.http.get<AdminBookingListItem[]>(`${this.baseUrl}/admin/bookings`, {
      withCredentials: true,
      params,
    });
  }

  getBooking(bookingId: string): Observable<AdminBookingDetail> {
    return this.http.get<AdminBookingDetail>(
      `${this.baseUrl}/admin/bookings/${encodeURIComponent(bookingId)}`,
      { withCredentials: true },
    );
  }

  listPendingFighterApprovals(): Observable<AdminFighterApprovalUser[]> {
    return this.http.get<AdminFighterApprovalUser[]>(`${this.baseUrl}/admin/fighter-approvals`, {
      withCredentials: true,
      params: new HttpParams().set('status', 'pending'),
    });
  }

  approveFighterUser(userId: string): Observable<{ ok: true }> {
    return this.http.post<{ ok: true }>(
      `${this.baseUrl}/admin/fighter-approvals/${encodeURIComponent(userId)}/approve`,
      {},
      { withCredentials: true },
    );
  }
}

