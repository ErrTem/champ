import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { AdminApiService, AdminBookingDetail } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-booking-detail',
  templateUrl: './admin-booking-detail.page.html',
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonText,
    IonCard,
    IonCardContent,
    IonButton,
    IonSkeletonText,
  ],
})
export class AdminBookingDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AdminApiService);

  loading = true;
  error = '';
  booking: AdminBookingDetail | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('bookingId') ?? '';
    if (!id) {
      this.loading = false;
      this.error = 'Booking not found';
      return;
    }
    this.fetch(id);
  }

  ionViewWillEnter(): void {
    const id = this.route.snapshot.paramMap.get('bookingId') ?? '';
    if (!id) {
      this.loading = false;
      this.error = 'Booking not found';
      return;
    }
    this.fetch(id);
  }

  fetch(id: string): void {
    this.loading = true;
    this.error = '';
    this.api
      .getBooking(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (b) => (this.booking = b),
        error: () => {
          this.booking = null;
          this.error = "Couldn’t load data. Check connection and try again.";
        },
      });
  }

  paymentLabel(status: string): string {
    if (status === 'confirmed') return 'Paid';
    if (status === 'expired') return 'Expired';
    return 'Unpaid';
  }

  formatPacificDateTime(utcIso: string): string {
    const d = new Date(utcIso);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  }
}

