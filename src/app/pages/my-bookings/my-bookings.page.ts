import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonChip,
  IonContent,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { BookingListItem } from '../../core/models/booking.models';
import { BookingService } from '../../core/services/booking.service';
import { HeaderComponent } from '../../shell/header.component';

const DISPLAY_TIMEZONE = 'America/Los_Angeles';
type Tab = 'upcoming' | 'past';

@Component({
  selector: 'app-my-bookings',
  templateUrl: './my-bookings.page.html',
  styleUrls: ['./my-bookings.page.scss'],
  imports: [
    CommonModule,
    HeaderComponent,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonChip,
    IonButton,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class MyBookingsPage {
  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);

  tab: Tab = 'upcoming';
  loading = true;
  error = '';
  bookings: BookingListItem[] = [];

  ionViewWillEnter(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';

    this.booking
      .listMyBookings()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (b) => (this.bookings = b ?? []),
        error: () => {
          this.bookings = [];
          this.error = "We couldn’t load your bookings. Check your connection and try again.";
        },
      });
  }

  refresh(ev: CustomEvent): void {
    this.booking.listMyBookings().subscribe({
      next: (b) => {
        this.bookings = b ?? [];
        (ev.target as HTMLIonRefresherElement).complete();
      },
      error: () => {
        this.error = "We couldn’t load your bookings. Check your connection and try again.";
        (ev.target as HTMLIonRefresherElement).complete();
      },
    });
  }

  setTab(value: string | number | null | undefined): void {
    const v = String(value ?? '');
    this.tab = v === 'past' ? 'past' : 'upcoming';
  }

  get upcomingBookings(): BookingListItem[] {
    const now = Date.now();
    return this.bookings
      .filter((b) => b.status !== 'expired' && new Date(b.startsAtUtc).getTime() >= now)
      .slice()
      .sort((a, b) => new Date(a.startsAtUtc).getTime() - new Date(b.startsAtUtc).getTime());
  }

  get pastBookings(): BookingListItem[] {
    const now = Date.now();
    return this.bookings
      .filter((b) => b.status === 'expired' || new Date(b.startsAtUtc).getTime() < now)
      .slice()
      .sort((a, b) => new Date(b.startsAtUtc).getTime() - new Date(a.startsAtUtc).getTime());
  }

  get visibleBookings(): BookingListItem[] {
    return this.tab === 'past' ? this.pastBookings : this.upcomingBookings;
  }

  openBooking(bookingId: string): void {
    void this.router.navigateByUrl(`/bookings/${encodeURIComponent(bookingId)}`);
  }

  explore(): void {
    void this.router.navigateByUrl('/explore');
  }

  formatPacificDateTime(utcIso: string): string {
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

  statusLabel(status: string): string {
    if (status === 'awaiting_payment') return 'Awaiting payment';
    if (status === 'confirmed') return 'Confirmed';
    if (status === 'expired') return 'Expired';
    return status;
  }
}

