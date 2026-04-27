import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonText,
  IonToggle,
  ToastController,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import {
  FighterSelfApiService,
  type FighterSelfBookingListItem,
  type FighterSelfScheduleRule,
  type FighterSelfService,
} from '../../../core/services/fighter-self-api.service';
import { HeaderComponent } from '../../../shell/header.component';

@Component({
  selector: 'app-fighter-tools',
  templateUrl: './fighter-tools.page.html',
  styleUrls: ['./fighter-tools.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    IonContent,
    IonText,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonToggle,
    IonChip,
    IonSelect,
    IonSelectOption,
    IonSkeletonText,
  ],
})
export class FighterToolsPage implements OnInit {
  private readonly api = inject(FighterSelfApiService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastController);

  readonly isApprovedFighter = computed(() => {
    const u = this.auth.user();
    return !!u && u.userType === 'fighter' && u.fighterStatus === 'approved';
  });

  loading = true;
  error = '';

  // Schedule
  loadingRules = false;
  savingRules = false;
  readonly dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  rulesByDay: Array<Array<FighterSelfScheduleRule>> = Array.from({ length: 7 }, () => []);

  // Services
  servicesLoading = false;
  savingService = false;
  services: FighterSelfService[] = [];
  editing: null | {
    mode: 'create' | 'edit';
    id?: string;
    title: string;
    durationMinutes: number;
    modality: 'online' | 'in_person';
    priceCents: number;
    currency: string;
    published: boolean;
  } = null;

  // Bookings
  bookingsLoading = false;
  bookings: FighterSelfBookingListItem[] = [];
  cancelling = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.loading = true;
    this.error = '';
    this.auth
      .loadProfile()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          if (!this.isApprovedFighter()) return;
          this.fetchRules();
          this.fetchServices();
          this.fetchBookings();
        },
        error: () => {
          this.error = "Couldn’t load profile. Check connection and try again.";
        },
      });
  }

  fetchRules(): void {
    this.loadingRules = true;
    this.error = '';
    this.api
      .getScheduleRules()
      .pipe(finalize(() => (this.loadingRules = false)))
      .subscribe({
        next: (rules) => {
          const byDay: Array<Array<FighterSelfScheduleRule>> = Array.from({ length: 7 }, () => []);
          for (const r of rules ?? []) {
            if (r.dayOfWeek < 0 || r.dayOfWeek > 6) continue;
            byDay[r.dayOfWeek]!.push(r);
          }
          for (const day of byDay) day.sort((a, b) => a.startMinute - b.startMinute);
          this.rulesByDay = byDay;
        },
        error: () => {
          this.rulesByDay = Array.from({ length: 7 }, () => []);
          this.error = "Couldn’t load schedule rules. Check connection and try again.";
        },
      });
  }

  addWindow(dayOfWeek: number): void {
    this.rulesByDay[dayOfWeek] = [
      ...this.rulesByDay[dayOfWeek]!,
      { dayOfWeek, startMinute: 9 * 60, endMinute: 12 * 60, active: true },
    ];
  }

  removeWindow(dayOfWeek: number, idx: number): void {
    const next = this.rulesByDay[dayOfWeek]!.slice();
    next.splice(idx, 1);
    this.rulesByDay[dayOfWeek] = next;
  }

  minuteToTime(minute: number): string {
    const m = Math.max(0, Math.min(1439, Math.floor(minute)));
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  timeToMinute(value: string): number {
    const v = String(value ?? '').trim();
    const m = /^(\d{2}):(\d{2})$/.exec(v);
    if (!m) return 0;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
    return Math.max(0, Math.min(1439, hh * 60 + mm));
  }

  setStart(dayOfWeek: number, idx: number, value: string | number | null | undefined): void {
    const next = this.rulesByDay[dayOfWeek]!.slice();
    const r = { ...next[idx]! };
    r.startMinute = this.timeToMinute(String(value ?? '00:00'));
    next[idx] = r;
    next.sort((a, b) => a.startMinute - b.startMinute);
    this.rulesByDay[dayOfWeek] = next;
  }

  setEnd(dayOfWeek: number, idx: number, value: string | number | null | undefined): void {
    const next = this.rulesByDay[dayOfWeek]!.slice();
    const r = { ...next[idx]! };
    r.endMinute = this.timeToMinute(String(value ?? '00:00'));
    next[idx] = r;
    next.sort((a, b) => a.startMinute - b.startMinute);
    this.rulesByDay[dayOfWeek] = next;
  }

  async saveRules(): Promise<void> {
    if (!this.isApprovedFighter()) return;
    this.savingRules = true;
    this.error = '';

    const rules: FighterSelfScheduleRule[] = [];
    for (let day = 0; day < 7; day++) {
      for (const r of this.rulesByDay[day] ?? []) {
        rules.push({
          dayOfWeek: day,
          startMinute: r.startMinute,
          endMinute: r.endMinute,
          active: true,
        });
      }
    }

    this.api
      .replaceScheduleRules(rules)
      .pipe(finalize(() => (this.savingRules = false)))
      .subscribe({
        next: async () => {
          const t = await this.toast.create({ message: 'Saved', duration: 1400, position: 'bottom' });
          await t.present();
        },
        error: async (e) => {
          if (e?.status === 403) {
            const t = await this.toast.create({
              message: 'Fighter approval required',
              duration: 1800,
              position: 'bottom',
            });
            await t.present();
            return;
          }
          this.error = "Couldn’t save schedule. Check connection and try again.";
        },
      });
  }

  fetchServices(): void {
    this.servicesLoading = true;
    this.error = '';
    this.api
      .listServices()
      .pipe(finalize(() => (this.servicesLoading = false)))
      .subscribe({
        next: (rows) => (this.services = rows ?? []),
        error: () => {
          this.services = [];
          this.error = "Couldn’t load services. Check connection and try again.";
        },
      });
  }

  openCreate(): void {
    this.editing = {
      mode: 'create',
      title: '',
      durationMinutes: 60,
      modality: 'in_person',
      priceCents: 0,
      currency: 'USD',
      published: false,
    };
  }

  openEdit(s: FighterSelfService): void {
    this.editing = {
      mode: 'edit',
      id: s.id,
      title: s.title,
      durationMinutes: s.durationMinutes,
      modality: (s.modality as any) === 'online' ? 'online' : 'in_person',
      priceCents: s.priceCents,
      currency: s.currency,
      published: !!s.published,
    };
  }

  cancelEdit(): void {
    this.editing = null;
  }

  async saveService(): Promise<void> {
    if (!this.editing) return;
    if (!this.editing.title.trim()) {
      this.error = 'Title required';
      return;
    }

    this.savingService = true;
    this.error = '';

    const body = {
      title: this.editing.title.trim(),
      durationMinutes: Number(this.editing.durationMinutes) || 60,
      modality: this.editing.modality,
      priceCents: Number(this.editing.priceCents) || 0,
      currency: this.editing.currency.trim() || 'USD',
      published: this.editing.published,
    };

    const req =
      this.editing.mode === 'create'
        ? this.api.createService(body)
        : this.api.updateService(this.editing.id!, body);

    req.pipe(finalize(() => (this.savingService = false))).subscribe({
      next: async () => {
        this.editing = null;
        this.fetchServices();
        const t = await this.toast.create({
          message: 'Saved',
          duration: 1400,
          position: 'top',
          color: 'success',
          cssClass: 'toast-success',
        });
        await t.present();
      },
      error: async (e) => {
        if (e?.status === 403) {
          const t = await this.toast.create({
            message: 'Fighter approval required',
            duration: 1800,
            position: 'top',
          });
          await t.present();
          return;
        }
        this.error = "Couldn’t save. Check connection and try again.";
      },
    });
  }

  fetchBookings(): void {
    this.bookingsLoading = true;
    this.error = '';
    this.api
      .listBookings()
      .pipe(finalize(() => (this.bookingsLoading = false)))
      .subscribe({
        next: (rows) => (this.bookings = rows ?? []),
        error: () => {
          this.bookings = [];
          this.error = "Couldn’t load bookings. Check connection and try again.";
        },
      });
  }

  async cancelBooking(b: FighterSelfBookingListItem): Promise<void> {
    const ok = window.confirm('Cancel this booking?');
    if (!ok) return;

    this.cancelling.set({ ...this.cancelling(), [b.id]: true });
    this.api
      .cancelBooking(b.id)
      .pipe(
        finalize(() => {
          const next = { ...this.cancelling() };
          delete next[b.id];
          this.cancelling.set(next);
        }),
      )
      .subscribe({
        next: async () => {
          this.fetchBookings();
          const t = await this.toast.create({ message: 'Cancelled', duration: 1600, position: 'bottom' });
          await t.present();
        },
        error: async (e) => {
          if (e?.status === 403) {
            const t = await this.toast.create({
              message: 'Fighter approval required',
              duration: 1800,
              position: 'bottom',
            });
            await t.present();
            return;
          }
          const t = await this.toast.create({
            message: 'Could not cancel. Maybe already started.',
            duration: 2000,
            position: 'bottom',
          });
          await t.present();
        },
      });
  }

  formatMoney(cents: number, currency: string): string {
    const v = Number(cents) / 100;
    return `${v.toFixed(2)} ${currency || 'USD'}`;
  }
}

