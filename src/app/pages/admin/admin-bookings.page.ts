import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import {
  AdminApiService,
  AdminBookingListItem,
  AdminFighter,
} from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-bookings',
  templateUrl: './admin-bookings.page.html',
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonText,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonButton,
    IonCard,
    IonCardContent,
    IonSkeletonText,
  ],
})
export class AdminBookingsPage implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  fighters: AdminFighter[] = [];
  bookings: AdminBookingListItem[] = [];

  loading = true;
  error = '';

  status = '';
  fighterId = '';
  from = '';
  to = '';

  ngOnInit(): void {
    this.fetchFighters();
    this.fetch();
  }

  ionViewWillEnter(): void {
    this.fetchFighters();
    this.fetch();
  }

  fetchFighters(): void {
    this.api.listFighters().subscribe({
      next: (f) => (this.fighters = (f ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))),
      error: () => (this.fighters = []),
    });
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    this.api
      .listBookings({
        status: this.status || undefined,
        fighterId: this.fighterId || undefined,
        from: this.from || undefined,
        to: this.to || undefined,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (rows) => (this.bookings = rows ?? []),
        error: async (e) => {
          this.bookings = [];
          if (e?.status === 403) {
            const t = await this.toast.create({
              message: 'Admin access required',
              duration: 1800,
              position: 'bottom',
            });
            await t.present();
            return;
          }
          this.error = "Couldn’t load data. Check connection and try again.";
        },
      });
  }

  open(b: AdminBookingListItem): void {
    void this.router.navigateByUrl(`/admin/bookings/${encodeURIComponent(b.id)}`);
  }

  statusLabel(status: string): string {
    if (status === 'awaiting_payment') return 'Awaiting payment';
    if (status === 'confirmed') return 'Confirmed';
    if (status === 'expired') return 'Expired';
    return status;
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

