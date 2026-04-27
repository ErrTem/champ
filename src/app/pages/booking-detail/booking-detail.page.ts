import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonButton, IonChip, IonContent, IonHeader, IonLabel, IonSkeletonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { Booking } from '../../core/models/booking.models';
import { BookingService } from '../../core/services/booking.service';

const DISPLAY_TIMEZONE = 'America/Los_Angeles';

@Component({
  selector: 'app-booking-detail',
  templateUrl: './booking-detail.page.html',
  styleUrls: ['./booking-detail.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonChip, IonLabel, IonSkeletonText],
})
export class BookingDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);

  bookingId = '';
  loading = true;
  error = '';
  data: Booking | null = null;

  openingCheckout = false;
  checkoutError = '';

  icsError = '';

  ionViewWillEnter(): void {
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') ?? '';
    if (!this.bookingId) {
      this.loading = false;
      this.error = 'Missing bookingId.';
      return;
    }
    this.fetch();
  }

  fetch(): void {
    if (!this.bookingId) return;
    this.loading = true;
    this.error = '';
    this.data = null;

    this.booking
      .getBooking(this.bookingId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (b) => (this.data = b),
        error: () => {
          this.error = 'Could not load booking.';
        },
      });
  }

  payNow(): void {
    if (!this.data?.id || this.data.status !== 'awaiting_payment') return;
    this.openingCheckout = true;
    this.checkoutError = '';

    this.booking
      .createCheckoutSession(this.data.id)
      .pipe(finalize(() => (this.openingCheckout = false)))
      .subscribe({
        next: (res) => {
          window.location.href = res.checkoutUrl;
        },
        error: () => {
          this.checkoutError = "Couldn’t open checkout. Check your connection and try again.";
        },
      });
  }

  addToCalendar(): void {
    if (!this.data?.id) return;
    this.icsError = '';
    this.booking.downloadIcs(this.data.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `booking-${this.data!.id}.ics`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => {
        this.icsError = 'Calendar export unavailable.';
      },
    });
  }

  formatPacificDateTime(utcIso: string | undefined): string {
    if (!utcIso) return '—';
    const d = new Date(utcIso);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: DISPLAY_TIMEZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  }

  formatPrice(priceCents: number | undefined, currency: string | undefined): string {
    if (typeof priceCents !== 'number') return '—';
    const cur = currency || 'USD';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(priceCents / 100);
  }

  statusLabel(status: string): string {
    if (status === 'awaiting_payment') return 'Awaiting payment';
    if (status === 'confirmed') return 'Confirmed';
    if (status === 'expired') return 'Expired';
    return status;
  }
}

