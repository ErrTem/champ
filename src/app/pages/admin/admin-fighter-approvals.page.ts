import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonSkeletonText,
  IonText,
  ToastController,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import {
  AdminApiService,
  AdminFighterApprovalUser,
} from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-fighter-approvals',
  templateUrl: './admin-fighter-approvals.page.html',
  imports: [
    CommonModule,
    IonContent,
    IonText,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonSkeletonText,
  ],
})
export class AdminFighterApprovalsPage {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastController);

  loading = true;
  saving = false;
  error = '';
  users: AdminFighterApprovalUser[] = [];

  ionViewWillEnter(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    this.api
      .listPendingFighterApprovals()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (rows) => (this.users = rows ?? []),
        error: () => {
          this.users = [];
          this.error = "Couldn’t load pending fighters. Check connection and try again.";
        },
      });
  }

  async approve(userId: string): Promise<void> {
    if (this.saving) return;
    this.saving = true;
    this.error = '';

    this.api
      .approveFighterUser(userId)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: async () => {
          this.users = this.users.filter((u) => u.id !== userId);
          const t = await this.toast.create({
            message: 'Approved',
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
          this.error = "Couldn’t approve. Try again.";
        },
      });
  }
}

