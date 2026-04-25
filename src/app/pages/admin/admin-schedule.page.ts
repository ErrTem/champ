import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { AdminApiService, AdminFighter, AdminScheduleRule } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-schedule',
  templateUrl: './admin-schedule.page.html',
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
    IonCard,
    IonCardContent,
    IonInput,
    IonButton,
    IonSkeletonText,
  ],
})
export class AdminSchedulePage {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastController);

  fighters: AdminFighter[] = [];
  fighterId = '';

  loadingFighters = true;
  loadingRules = false;
  saving = false;
  error = '';
  saved = false;

  readonly dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  rulesByDay: Array<Array<AdminScheduleRule>> = Array.from({ length: 7 }, () => []);

  ionViewWillEnter(): void {
    this.fetchFighters();
  }

  fetchFighters(): void {
    this.loadingFighters = true;
    this.error = '';
    this.api
      .listFighters()
      .pipe(finalize(() => (this.loadingFighters = false)))
      .subscribe({
        next: (f) => {
          this.fighters = (f ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
          if (!this.fighterId && this.fighters.length > 0) {
            this.fighterId = this.fighters[0]!.id;
            this.fetchRules();
          }
        },
        error: () => {
          this.fighters = [];
          this.error = "Couldn’t load data. Check connection and try again.";
        },
      });
  }

  onFighterChange(): void {
    if (!this.fighterId) return;
    this.fetchRules();
  }

  fetchRules(): void {
    this.loadingRules = true;
    this.saved = false;
    this.error = '';
    this.api
      .getScheduleRules(this.fighterId)
      .pipe(finalize(() => (this.loadingRules = false)))
      .subscribe({
        next: (rules) => {
          const byDay: Array<Array<AdminScheduleRule>> = Array.from({ length: 7 }, () => []);
          for (const r of rules ?? []) {
            if (r.dayOfWeek < 0 || r.dayOfWeek > 6) continue;
            byDay[r.dayOfWeek]!.push(r);
          }
          for (const day of byDay) {
            day.sort((a, b) => a.startMinute - b.startMinute);
          }
          this.rulesByDay = byDay;
        },
        error: () => {
          this.rulesByDay = Array.from({ length: 7 }, () => []);
          this.error = "Couldn’t load data. Check connection and try again.";
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

  async save(): Promise<void> {
    if (!this.fighterId) return;
    this.saving = true;
    this.saved = false;
    this.error = '';

    const rules: AdminScheduleRule[] = [];
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
      .replaceScheduleRules(this.fighterId, rules)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: async () => {
          this.saved = true;
          const t = await this.toast.create({
            message: 'Saved',
            duration: 1400,
            position: 'bottom',
          });
          await t.present();
        },
        error: async (e) => {
          if (e?.status === 403) {
            const t = await this.toast.create({
              message: 'Admin access required',
              duration: 1800,
              position: 'bottom',
            });
            await t.present();
            return;
          }
          this.error = "Couldn’t save. Check connection and try again.";
        },
      });
  }
}

