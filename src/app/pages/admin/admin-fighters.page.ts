import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
  IonSkeletonText,
  IonText,
  IonTextarea,
  IonToggle,
  ToastController,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { AdminApiService, AdminFighter } from '../../core/services/admin-api.service';
import { HeaderComponent } from '../../shell/header.component';

@Component({
  selector: 'app-admin-fighters',
  templateUrl: './admin-fighters.page.html',
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
    IonTextarea,
    IonToggle,
    IonButton,
    IonChip,
    IonSkeletonText,
  ],
})
export class AdminFightersPage {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastController);

  fighters: AdminFighter[] = [];
  loading = true;
  saving = false;
  error = '';

  editing: null | {
    mode: 'create' | 'edit';
    id?: string;
    name: string;
    summary: string;
    bio: string;
    photoUrl: string;
    published: boolean;
  } = null;

  ionViewWillEnter(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    this.api
      .listFighters()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (rows) => (this.fighters = (rows ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))),
        error: () => {
          this.fighters = [];
          this.error = "Couldn’t load data. Check connection and try again.";
        },
      });
  }

  openCreate(): void {
    this.editing = { mode: 'create', name: '', summary: '', bio: '', photoUrl: '', published: false };
  }

  openEdit(f: AdminFighter): void {
    this.editing = {
      mode: 'edit',
      id: f.id,
      name: f.name,
      summary: f.summary ?? '',
      bio: f.bio ?? '',
      photoUrl: f.photoUrl ?? '',
      published: !!f.published,
    };
  }

  cancelEdit(): void {
    this.editing = null;
  }

  async save(): Promise<void> {
    if (!this.editing) return;
    if (!this.editing.name.trim()) {
      this.error = 'Name required';
      return;
    }

    this.saving = true;
    this.error = '';

    const body = {
      name: this.editing.name.trim(),
      summary: this.editing.summary.trim() || undefined,
      bio: this.editing.bio.trim() || undefined,
      photoUrl: this.editing.photoUrl.trim() || undefined,
      published: this.editing.published,
    };

    const req =
      this.editing.mode === 'create'
        ? this.api.createFighter(body)
        : this.api.updateFighter(this.editing.id!, body);

    req.pipe(finalize(() => (this.saving = false))).subscribe({
      next: async () => {
        this.editing = null;
        this.fetch();
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
}

