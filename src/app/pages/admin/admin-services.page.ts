import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
import { AdminApiService, AdminFighter, AdminService } from '../../core/services/admin-api.service';
import { HeaderComponent } from '../../shell/header.component';

@Component({
  selector: 'app-admin-services',
  templateUrl: './admin-services.page.html',
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
    IonSelect,
    IonSelectOption,
    IonInput,
    IonToggle,
    IonButton,
    IonChip,
    IonSkeletonText,
  ],
})
export class AdminServicesPage implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastController);

  fighters: AdminFighter[] = [];
  fighterId = '';

  services: AdminService[] = [];
  loading = true;
  loadingServices = false;
  saving = false;
  error = '';

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

  ngOnInit(): void {
    this.fetchFighters();
  }

  ionViewWillEnter(): void {
    this.fetchFighters();
  }

  fetchFighters(): void {
    this.loading = true;
    this.error = '';
    this.api
      .listFighters()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (rows) => {
          this.fighters = (rows ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
          if (!this.fighterId && this.fighters.length > 0) {
            this.fighterId = this.fighters[0]!.id;
          }
          if (this.fighterId) this.fetchServices();
        },
        error: () => {
          this.fighters = [];
          this.error = "Couldn’t load data. Check connection and try again.";
        },
      });
  }

  onFighterChange(): void {
    this.editing = null;
    this.services = [];
    if (this.fighterId) this.fetchServices();
  }

  fetchServices(): void {
    if (!this.fighterId) return;
    this.loadingServices = true;
    this.error = '';
    this.api
      .listFighterServices(this.fighterId)
      .pipe(finalize(() => (this.loadingServices = false)))
      .subscribe({
        next: (rows) => (this.services = rows ?? []),
        error: () => {
          this.services = [];
          this.error = "Couldn’t load data. Check connection and try again.";
        },
      });
  }

  openCreate(): void {
    if (!this.fighterId) return;
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

  openEdit(s: AdminService): void {
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

  async save(): Promise<void> {
    if (!this.editing || !this.fighterId) return;
    if (!this.editing.title.trim()) {
      this.error = 'Title required';
      return;
    }

    this.saving = true;
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
        ? this.api.createFighterService(this.fighterId, body)
        : this.api.updateService(this.editing.id!, body);

    req.pipe(finalize(() => (this.saving = false))).subscribe({
      next: async () => {
        this.editing = null;
        this.fetchServices();
        const t = await this.toast.create({ message: 'Saved', duration: 1400, position: 'bottom' });
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

  formatMoney(cents: number, currency: string): string {
    const v = Number(cents) / 100;
    return `${v.toFixed(2)} ${currency || 'USD'}`;
  }
}

