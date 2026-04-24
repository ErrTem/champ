import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AvailabilityResponse, Booking, CreateBookingRequest } from '../models/booking.models';

export type CreateBookingError = {
  status: number;
  code?: string;
  message?: string;
  raw?: unknown;
};

function coerceCreateBookingError(err: unknown): CreateBookingError {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as unknown;
    const code =
      body && typeof body === 'object' && 'code' in body && typeof (body as any).code === 'string'
        ? ((body as any).code as string)
        : undefined;
    const message =
      body && typeof body === 'object' && 'message' in body && typeof (body as any).message === 'string'
        ? ((body as any).message as string)
        : typeof err.message === 'string'
          ? err.message
          : undefined;
    return { status: err.status, code, message, raw: body };
  }
  return { status: 0, raw: err };
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getAvailability(params: {
    fighterId: string;
    serviceId: string;
    days?: number;
  }): Observable<AvailabilityResponse> {
    const httpParams = new HttpParams()
      .set('fighterId', params.fighterId)
      .set('serviceId', params.serviceId)
      .set('days', String(params.days ?? 30));

    return this.http.get<AvailabilityResponse>(`${this.baseUrl}/availability`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  createBooking(slotId: string): Observable<Booking> {
    const body: CreateBookingRequest = { slotId };
    return this.http
      .post<Booking>(`${this.baseUrl}/bookings`, body, { withCredentials: true })
      .pipe(catchError((e) => throwError(() => coerceCreateBookingError(e))));
  }
}

