import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Subscription, timer } from 'rxjs';
import { Booking } from '../../core/models/booking.models';
import { BookingService } from '../../core/services/booking.service';

@Component({
  selector: 'app-payment-return',
  templateUrl: './payment-return.page.html',
  styleUrls: ['./payment-return.page.scss'],
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonText,
    IonSpinner,
    IonButton,
  ],
})
export class PaymentReturnPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);

  bookingId = '';
  result: 'success' | 'cancel' | 'unknown' = 'unknown';

  loading = true;
  bookingData: Booking | null = null;
  message = '';
  pollSub: Subscription | null = null;

  ionViewWillEnter(): void {
    this.bookingId = this.route.snapshot.queryParamMap.get('bookingId') ?? '';
    const result = this.route.snapshot.queryParamMap.get('result');
    this.result = result === 'success' ? 'success' : result === 'cancel' ? 'cancel' : 'unknown';

    if (!this.bookingId) {
      this.loading = false;
      this.message = 'Missing bookingId.';
      return;
    }

    if (this.result === 'cancel') {
      this.loading = false;
      void this.router.navigate(['/book'], {
        queryParams: { bookingId: this.bookingId, step: 'created', notice: 'cancelled' },
      });
      return;
    }

    this.message = 'Payment received. Confirming your booking…';
    this.loading = true;
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }

  private startPolling(): void {
    this.pollSub?.unsubscribe();

    const maxMs = 15000;
    const startedAt = Date.now();

    const pollOnce = (delayMs: number) => {
      this.pollSub = timer(delayMs).subscribe(() => {
        this.booking.getBooking(this.bookingId).subscribe({
          next: (b) => {
            this.bookingData = b;
            if (b.status === 'confirmed') {
              this.loading = false;
              void this.router.navigate(['/booking/success'], { queryParams: { bookingId: this.bookingId } });
              return;
            }

            const elapsed = Date.now() - startedAt;
            if (elapsed >= maxMs) {
              this.loading = false;
              this.message = 'We’re still confirming your booking. Check “My bookings” in a moment.';
              return;
            }

            // 1–2s backoff
            pollOnce(delayMs === 0 ? 1000 : Math.min(delayMs + 500, 2000));
          },
          error: () => {
            this.loading = false;
            this.message = 'Could not confirm booking status. Please try again.';
          },
        });
      });
    };

    pollOnce(0);
  }
}

