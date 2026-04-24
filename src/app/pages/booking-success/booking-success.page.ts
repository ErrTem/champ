import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonSkeletonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { Booking } from '../../core/models/booking.models';
import { BookingService } from '../../core/services/booking.service';

@Component({
  selector: 'app-booking-success',
  templateUrl: './booking-success.page.html',
  styleUrls: ['./booking-success.page.scss'],
  imports: [CommonModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonSkeletonText],
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
}

