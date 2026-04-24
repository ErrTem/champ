import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonChip,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonSkeletonText,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { FighterProfile, Service } from '../../core/models/catalog.models';
import { AvailabilityDay, Booking, Slot } from '../../core/models/booking.models';
import { BookingService, CreateBookingError } from '../../core/services/booking.service';
import { CatalogService } from '../../core/services/catalog.service';

type BookingStep = 'select' | 'review' | 'created';
type SlotBucket = 'morning' | 'afternoon' | 'evening';

const DISPLAY_TIMEZONE = 'America/Los_Angeles';
const HORIZON_DAYS = 30;

@Component({
  selector: 'app-book-placeholder',
  templateUrl: './book-placeholder.page.html',
  styleUrls: ['./book-placeholder.page.scss'],
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonText,
    IonSkeletonText,
    IonButton,
    IonFooter,
    IonIcon,
    IonChip,
    IonSpinner,
  ],
})
export class BookPlaceholderPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  private readonly booking = inject(BookingService);

  private qpSub: { unsubscribe(): void } | null = null;

  fighterId: string | null = null;
  serviceId: string | null = null;

  fighter: FighterProfile | null = null;
  service: Service | null = null;

  step: BookingStep = 'select';

  loadingSelection = true;
  loadingAvailability = true;
  errorSelection = '';
  errorAvailability = '';

  availabilityDays: AvailabilityDay[] = [];
  availabilityByDate = new Map<string, AvailabilityDay>();

  horizonDates: string[] = [];
  displayedMonthLabel = '';

  selectedDate: string | null = null; // YYYY-MM-DD (America/Los_Angeles)
  selectedSlotId: string | null = null;

  reserving = false;
  reserveError: { title: string; body: string; actionLabel?: string } | null = null;

  createdBooking: Booking | null = null;

  ionViewWillEnter(): void {
    if (!this.qpSub) {
      this.qpSub = this.route.queryParamMap.subscribe(() => this.loadFromUrl());
    }
    this.loadFromUrl();
  }

  ngOnDestroy(): void {
    this.qpSub?.unsubscribe();
    this.qpSub = null;
  }

  loadFromUrl(): void {
    this.fighterId = this.route.snapshot.queryParamMap.get('fighterId');
    this.serviceId = this.route.snapshot.queryParamMap.get('serviceId');
    const selectedDate = this.route.snapshot.queryParamMap.get('date');
    const selectedSlotId = this.route.snapshot.queryParamMap.get('slotId');

    if (!this.fighterId || !this.serviceId) {
      this.loadingSelection = false;
      this.errorSelection = 'Missing selection.';
      this.fighter = null;
      this.service = null;
      return;
    }

    this.step = this.route.snapshot.queryParamMap.get('step') === 'review' ? 'review' : 'select';
    this.selectedDate = selectedDate;
    this.selectedSlotId = selectedSlotId;

    this.loadingSelection = true;
    this.errorSelection = '';
    this.fighter = null;
    this.service = null;

    this.catalog
      .getFighterProfile(this.fighterId)
      .pipe(finalize(() => (this.loadingSelection = false)))
      .subscribe({
        next: (fighter) => {
          this.fighter = fighter;
          this.service = fighter.services.find((s) => s.id === this.serviceId) ?? null;
          if (!this.service) {
            this.errorSelection = 'Selected service not found.';
            return;
          }
          this.buildHorizon();
          this.loadAvailability();
        },
        error: () => {
          this.errorSelection = "Couldn’t load selection. Check your connection and try again.";
        },
      });
  }

  private buildHorizon(): void {
    const today = new Date();
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: DISPLAY_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    this.horizonDates = Array.from({ length: HORIZON_DAYS }, (_, i) => {
      const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      return fmt.format(d);
    });

    this.displayedMonthLabel = this.formatMonthLabel(this.horizonDates[0] ?? fmt.format(today));
  }

  private loadAvailability(): void {
    if (!this.fighterId || !this.serviceId) return;

    this.loadingAvailability = true;
    this.errorAvailability = '';
    this.reserveError = null;
    this.availabilityDays = [];
    this.availabilityByDate = new Map<string, AvailabilityDay>();

    this.booking
      .getAvailability({ fighterId: this.fighterId, serviceId: this.serviceId, days: HORIZON_DAYS })
      .pipe(finalize(() => (this.loadingAvailability = false)))
      .subscribe({
        next: (res) => {
          this.availabilityDays = res.days ?? [];
          this.availabilityByDate = new Map(this.availabilityDays.map((d) => [d.date, d]));

          if (this.selectedDate && this.availabilityByDate.has(this.selectedDate)) {
            // keep
          } else {
            const firstWithSlots = this.availabilityDays.find((d) => (d.slots?.length ?? 0) > 0);
            this.selectedDate = firstWithSlots?.date ?? null;
          }

          if (this.selectedSlotId) {
            const slots = this.selectedDate ? this.availabilityByDate.get(this.selectedDate)?.slots ?? [] : [];
            if (!slots.some((s) => s.slotId === this.selectedSlotId)) {
              this.selectedSlotId = null;
            }
          }
        },
        error: () => {
          this.errorAvailability = "Couldn’t load availability. Check your connection and try again.";
        },
      });
  }

  get selectedDay(): AvailabilityDay | null {
    if (!this.selectedDate) return null;
    return this.availabilityByDate.get(this.selectedDate) ?? null;
  }

  selectDate(date: string): void {
    this.selectedDate = date;
    this.selectedSlotId = null;
    this.reserveError = null;
  }

  selectSlot(slot: Slot): void {
    this.selectedSlotId = slot.slotId;
    this.reserveError = null;
  }

  confirmDateTime(): void {
    if (!this.selectedSlotId || !this.selectedDate) return;
    this.step = 'review';
  }

  changeTime(): void {
    this.step = 'select';
    this.createdBooking = null;
    this.reserveError = null;
  }

  backToProfile(): void {
    if (!this.fighterId) return;
    void this.router.navigateByUrl(`/fighters/${encodeURIComponent(this.fighterId)}`);
  }

  backToExplore(): void {
    void this.router.navigateByUrl('/explore');
  }

  reserveSlot(): void {
    if (!this.selectedSlotId) return;
    this.reserving = true;
    this.reserveError = null;

    this.booking
      .createBooking(this.selectedSlotId)
      .pipe(finalize(() => (this.reserving = false)))
      .subscribe({
        next: (booking) => {
          this.createdBooking = booking;
          this.step = 'created';
        },
        error: (e: CreateBookingError) => {
          if (e?.status === 401) {
            const returnTo = this.buildReturnToUrl();
            void this.router.navigate(['/login'], { queryParams: { returnTo } });
            return;
          }
          if (e?.status === 409 && e?.code === 'SLOT_UNAVAILABLE') {
            this.reserveError = {
              title: 'That time just got taken.',
              body: 'Pick another time — we refreshed today’s availability.',
              actionLabel: 'View updated times',
            };
            this.step = 'select';
            this.loadAvailability();
            return;
          }
          this.reserveError = {
            title: 'Couldn’t reserve that slot.',
            body: 'Check your connection and try again.',
          };
        },
      });
  }

  private buildReturnToUrl(): string {
    const fighterId = this.fighterId ?? '';
    const serviceId = this.serviceId ?? '';
    const qp: Record<string, string> = { fighterId, serviceId };
    if (this.selectedDate) qp['date'] = this.selectedDate;
    if (this.selectedSlotId) qp['slotId'] = this.selectedSlotId;
    if (this.step === 'review') qp['step'] = 'review';

    const qs = Object.entries(qp)
      .filter(([, v]) => v)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    return `/book?${qs}`;
  }

  bucketSlots(slots: Slot[]): Record<SlotBucket, Slot[]> {
    const out: Record<SlotBucket, Slot[]> = { morning: [], afternoon: [], evening: [] };
    for (const s of slots) {
      const hour = this.hourInTz(s.startsAtUtc);
      if (hour < 12) out.morning.push(s);
      else if (hour < 17) out.afternoon.push(s);
      else out.evening.push(s);
    }
    return out;
  }

  private hourInTz(utcIso: string): number {
    const d = new Date(utcIso);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: DISPLAY_TIMEZONE,
      hour: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(d);
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '0';
    return Number(hour);
  }

  formatSlotTime(utcIso: string): string {
    const d = new Date(utcIso);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: DISPLAY_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  }

  formatSelectedDate(date: string): string {
    // date is YYYY-MM-DD in DISPLAY_TIMEZONE; format as "Apr 24, 2026"
    const [y, m, d] = date.split('-').map((x) => Number(x));
    const utcMid = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat('en-US', {
      timeZone: DISPLAY_TIMEZONE,
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(utcMid);
  }

  private formatMonthLabel(date: string): string {
    const [y, m, d] = date.split('-').map((x) => Number(x));
    const utcMid = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat('en-US', {
      timeZone: DISPLAY_TIMEZONE,
      month: 'long',
      year: 'numeric',
    })
      .format(utcMid)
      .toUpperCase();
  }

  get selectedSlot(): Slot | null {
    if (!this.selectedSlotId || !this.selectedDay) return null;
    return this.selectedDay.slots.find((s) => s.slotId === this.selectedSlotId) ?? null;
  }

  formatUsd(cents: number): string {
    const dollars = Math.round(cents / 100);
    return `$${dollars}`;
  }

  modalityLabel(modality: string): string {
    if (modality === 'online') return 'Online';
    if (modality === 'in_person') return 'In person';
    return modality;
  }
}

