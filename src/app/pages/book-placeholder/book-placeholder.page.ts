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

const HORIZON_DAYS = 30;
const DOW_MON_START = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

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
  bookingId: string | null = null;

  fighter: FighterProfile | null = null;
  service: Service | null = null;
  availabilityTimezone: string | null = null;

  step: BookingStep = 'select';

  loadingSelection = true;
  loadingAvailability = true;
  errorSelection = '';
  errorAvailability = '';

  availabilityDays: AvailabilityDay[] = [];
  availabilityByDate = new Map<string, AvailabilityDay>();

  horizonDates: string[] = [];
  horizonSet = new Set<string>();
  months: string[] = []; // YYYY-MM
  selectedMonth: string | null = null; // YYYY-MM
  displayedMonthLabel = '';

  selectedDate: string | null = null; // YYYY-MM-DD (fighter/availability timezone)
  selectedSlotId: string | null = null;

  reserving = false;
  reserveError:
    | { kind: 'slot-unavailable' }
    | { kind: 'too-soon'; title: string; body: string }
    | { kind: 'generic'; title: string; body: string }
    | null = null;

  createdBooking: Booking | null = null;

  openingCheckout = false;
  checkoutError = '';

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
    this.bookingId = this.route.snapshot.queryParamMap.get('bookingId');
    const selectedDate = this.route.snapshot.queryParamMap.get('date');
    const selectedSlotId = this.route.snapshot.queryParamMap.get('slotId');
    const stepFromUrl = this.route.snapshot.queryParamMap.get('step');
    const notice = this.route.snapshot.queryParamMap.get('notice');

    this.checkoutError = '';
    if (notice === 'cancelled') {
      this.checkoutError = 'Payment cancelled. You can try again.';
    }

    this.step = stepFromUrl === 'created' ? 'created' : stepFromUrl === 'review' ? 'review' : 'select';
    this.selectedDate = selectedDate;
    this.selectedSlotId = selectedSlotId;

    if (this.bookingId) {
      this.loadingSelection = true;
      this.errorSelection = '';
      this.fighter = null;
      this.service = null;

      this.booking.getBooking(this.bookingId).pipe(finalize(() => (this.loadingSelection = false))).subscribe({
        next: (b) => {
          this.createdBooking = b;
          this.fighterId = b.slot.fighterId;
          this.serviceId = b.slot.serviceId;
          this.selectedSlotId = b.slot.slotId;

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
                if (!this.selectedDate) {
                  this.selectedDate = this.formatIsoDateInTz(new Date(b.slot.startsAtUtc));
                }
                this.buildHorizon();
                this.loadAvailability();
              },
              error: () => {
                this.errorSelection = "Couldn’t load selection. Check your connection and try again.";
              },
            });
        },
        error: () => {
          this.errorSelection = "Couldn’t load booking. Try again.";
        },
      });
      return;
    }

    if (!this.fighterId || !this.serviceId) {
      this.loadingSelection = false;
      this.errorSelection = 'Missing selection.';
      this.fighter = null;
      this.service = null;
      return;
    }

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
      timeZone: this.displayTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    this.horizonDates = Array.from({ length: HORIZON_DAYS }, (_, i) => {
      const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      return fmt.format(d);
    });

    this.horizonSet = new Set(this.horizonDates);
    this.months = this.uniqueMonthsFromDates(this.horizonDates);

    const monthFromSelected = this.selectedDate ? this.selectedDate.slice(0, 7) : null;
    this.selectedMonth =
      (monthFromSelected && this.months.includes(monthFromSelected) ? monthFromSelected : null) ??
      this.months[0] ??
      null;

    this.displayedMonthLabel = this.selectedMonth
      ? this.formatMonthLabel(`${this.selectedMonth}-01`)
      : this.formatMonthLabel(this.horizonDates[0] ?? fmt.format(today));
  }

  private loadAvailability(): void {
    if (!this.fighterId || !this.serviceId) return;

    this.loadingAvailability = true;
    this.errorAvailability = '';
    this.availabilityDays = [];
    this.availabilityByDate = new Map<string, AvailabilityDay>();
    this.availabilityTimezone = null;

    this.booking
      .getAvailability({ fighterId: this.fighterId, serviceId: this.serviceId, days: HORIZON_DAYS })
      .pipe(finalize(() => (this.loadingAvailability = false)))
      .subscribe({
        next: (res) => {
          this.availabilityTimezone = res.timezone ?? null;
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

    const m = date.slice(0, 7);
    if (this.months.includes(m)) {
      this.selectedMonth = m;
      this.displayedMonthLabel = this.formatMonthLabel(`${m}-01`);
    }
  }

  pickDifferentDate(): void {
    this.selectedSlotId = null;
    this.reserveError = null;
    // Keep horizon + month view intact; user can tap another day.
    this.selectedDate = null;
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
          this.bookingId = booking.id;
          this.step = 'created';
        },
        error: (e: CreateBookingError) => {
          if (e?.status === 401) {
            const returnTo = this.buildReturnToUrl();
            void this.router.navigate(['/login'], { queryParams: { returnTo } });
            return;
          }
          if (e?.status === 409 && e?.code === 'SLOT_UNAVAILABLE') {
            this.reserveError = { kind: 'slot-unavailable' };
            return;
          }
          if (e?.status === 400 && e?.code === 'BOOKING_TOO_SOON') {
            this.reserveError = {
              kind: 'too-soon',
              title: 'Too soon to book',
              body: e?.message || 'Bookings must be made at least 24 hours in advance.',
            };
            return;
          }
          this.reserveError = {
            kind: 'generic',
            title: 'Couldn’t reserve that slot.',
            body: 'Check your connection and try again.',
          };
        },
      });
  }

  payNow(): void {
    if (!this.createdBooking?.id) return;
    this.openingCheckout = true;
    this.checkoutError = '';

    this.booking
      .createCheckoutSession(this.createdBooking.id)
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

  viewUpdatedTimes(): void {
    // Keep the currently selected day, but clear the stale slot and refresh buckets for that day.
    this.step = 'select';
    this.selectedSlotId = null;
    this.reserveError = null;
    this.loadAvailability();
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
      timeZone: this.displayTimezone,
      hour: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '0';
    return Number(hour);
  }

  formatSlotTime(utcIso: string): string {
    const d = new Date(utcIso);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: this.displayTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  }

  formatSelectedDate(date: string): string {
    // date is YYYY-MM-DD in displayTimezone; format as "Apr 24, 2026"
    const [y, m, d] = date.split('-').map((x) => Number(x));
    const utcMid = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat('en-US', {
      timeZone: this.displayTimezone,
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(utcMid);
  }

  private formatMonthLabel(date: string): string {
    const [y, m, d] = date.split('-').map((x) => Number(x));
    const utcMid = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat('en-US', {
      timeZone: this.displayTimezone,
      month: 'long',
      year: 'numeric',
    })
      .format(utcMid)
      .toUpperCase();
  }

  get calendarCells(): Array<{ date: string | null; dayNum: string | null; disabled: boolean }> {
    if (!this.selectedMonth) return [];

    const [y, m] = this.selectedMonth.split('-').map((x) => Number(x));
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.displayTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const firstOfMonth = fmt.format(new Date(Date.UTC(y, m - 1, 1, 12, 0, 0)));
    const firstDow = this.dowIndexMonStart(firstOfMonth);

    const days: string[] = [];
    for (let day = 1; day <= 31; day++) {
      const d = fmt.format(new Date(Date.UTC(y, m - 1, day, 12, 0, 0)));
      if (d.slice(0, 7) !== this.selectedMonth) break;
      days.push(d);
    }

    const cells: Array<{ date: string | null; dayNum: string | null; disabled: boolean }> = [];
    for (let i = 0; i < firstDow; i++) {
      cells.push({ date: null, dayNum: null, disabled: true });
    }
    for (const d of days) {
      cells.push({
        date: d,
        dayNum: d.split('-')[2] ?? null,
        disabled: !this.horizonSet.has(d),
      });
    }
    const rem = cells.length % 7;
    if (rem !== 0) {
      const pad = 7 - rem;
      for (let i = 0; i < pad; i++) cells.push({ date: null, dayNum: null, disabled: true });
    }
    return cells;
  }

  monthCanGoPrev(): boolean {
    if (!this.selectedMonth) return false;
    const idx = this.months.indexOf(this.selectedMonth);
    return idx > 0;
  }

  monthCanGoNext(): boolean {
    if (!this.selectedMonth) return false;
    const idx = this.months.indexOf(this.selectedMonth);
    return idx >= 0 && idx < this.months.length - 1;
  }

  monthPrev(): void {
    if (!this.selectedMonth) return;
    const idx = this.months.indexOf(this.selectedMonth);
    if (idx <= 0) return;
    const next = this.months[idx - 1]!;
    this.selectedMonth = next;
    this.displayedMonthLabel = this.formatMonthLabel(`${next}-01`);
  }

  monthNext(): void {
    if (!this.selectedMonth) return;
    const idx = this.months.indexOf(this.selectedMonth);
    if (idx < 0 || idx >= this.months.length - 1) return;
    const next = this.months[idx + 1]!;
    this.selectedMonth = next;
    this.displayedMonthLabel = this.formatMonthLabel(`${next}-01`);
  }

  selectCalendarCell(cell: { date: string | null; disabled: boolean }): void {
    if (!cell.date || cell.disabled) return;
    this.selectDate(cell.date);
  }

  dowLabels(): string[] {
    return [...DOW_MON_START];
  }

  private uniqueMonthsFromDates(dates: string[]): string[] {
    const out: string[] = [];
    for (const d of dates) {
      const m = d.slice(0, 7);
      if (!out.includes(m)) out.push(m);
    }
    return out;
  }

  private dowIndexMonStart(date: string): number {
    // date is YYYY-MM-DD in displayTimezone. Return 0..6 where 0=Mon.
    const [y, m, d] = date.split('-').map((x) => Number(x));
    const utcMid = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const wd = new Intl.DateTimeFormat('en-US', {
      timeZone: this.displayTimezone,
      weekday: 'short',
    }).format(utcMid);
    const idxSunStart = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd);
    if (idxSunStart < 0) return 0;
    return (idxSunStart + 6) % 7;
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

  private get displayTimezone(): string {
    return this.availabilityTimezone ?? this.fighter?.gym?.timezone ?? 'utc';
  }

  private formatIsoDateInTz(d: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.displayTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }
}

