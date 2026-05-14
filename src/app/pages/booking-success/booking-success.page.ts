import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSkeletonText } from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { Booking } from '../../core/models/booking.models';
import { BookingService } from '../../core/services/booking.service';

@Component({
  selector: 'app-booking-success',
  templateUrl: './booking-success.page.html',
  styleUrls: ['./booking-success.page.scss'],
  imports: [CommonModule, RouterLink, IonContent, IonButton, IonSkeletonText, IonIcon],
})
export class BookingSuccessPage {
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);

  loading = true;
  error = '';
  data: Booking | null = null;

  ionViewWillEnter(): void {
    const bookingId = this.route.snapshot.queryParamMap.get('bookingId');
    if (!bookingId) {
      this.loading = false;
      this.error = 'Missing bookingId.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.data = null;
    this.booking
      .getBooking(bookingId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (b) => {
          this.data = b;
        },
        error: () => {
          this.error = 'Could not load booking.';
        },
      });
  }

  badgeLabel(): string {
    const s = this.data?.status?.trim();
    return s ? s.toUpperCase() : 'CONFIRMED';
  }

  fighterDisplayName(): string {
    const n = this.data?.fighterName?.trim();
    return n || 'your coach';
  }

  sessionTitle(): string {
    const t = this.data?.serviceTitle?.trim();
    return t || 'Training session';
  }

  sessionSubtitle(): string {
    const id = this.data?.id;
    if (this.data?.fighterName?.trim()) {
      return `with ${this.data.fighterName.trim()}`;
    }
    if (id) {
      return `Ref ${id}`;
    }
    return 'Details in My Bookings';
  }

  private sessionBounds(): { start: Date; end: Date } | null {
    const b = this.data;
    if (!b) {
      return null;
    }
    const startRaw = b.startsAtUtc ?? b.slot?.startsAtUtc;
    const endRaw = b.endsAtUtc ?? b.slot?.endsAtUtc;
    if (!startRaw || !endRaw) {
      return null;
    }
    const start = new Date(startRaw);
    const end = new Date(endRaw);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }
    return { start, end };
  }

  formatSessionDate(): string {
    const bounds = this.sessionBounds();
    if (!bounds) {
      return '—';
    }
    return bounds.start.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatTimeRange(): string {
    const bounds = this.sessionBounds();
    if (!bounds) {
      return 'Time TBD';
    }
    const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
    return `${bounds.start.toLocaleTimeString(undefined, opts)} — ${bounds.end.toLocaleTimeString(undefined, opts)}`;
  }

  canAddToCalendar(): boolean {
    return this.sessionBounds() !== null;
  }

  addToCalendar(): void {
    const b = this.data;
    const bounds = this.sessionBounds();
    if (!b || !bounds) {
      return;
    }
    const fmt = (d: Date) =>
      d
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');
    const dates = `${fmt(bounds.start)}Z/${fmt(bounds.end)}Z`;
    const title = b.serviceTitle?.trim() || 'Training session';
    const details = [b.fighterName?.trim() && `Coach: ${b.fighterName}`, b.id && `Booking: ${b.id}`]
      .filter(Boolean)
      .join('\n');
    const url =
      'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      `&text=${encodeURIComponent(title)}` +
      `&dates=${encodeURIComponent(dates)}` +
      `&details=${encodeURIComponent(details)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
