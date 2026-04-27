import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonToggle,
  IonItem,
  IonList,
  IonText,
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { NotificationPreferences, NotificationPreferencesService } from '../../core/services/notification-preferences.service';
import { PushService } from '../../core/services/push.service';
import { HeaderComponent } from '../../shell/header.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    HeaderComponent,
    IonContent,
    IonButton,
    IonInput,
    IonToggle,
    IonItem,
    IonList,
    IonText,
  ],
})
export class ProfilePage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly prefsApi = inject(NotificationPreferencesService);
  private readonly push = inject(PushService);

  name = '';
  email = '';
  phone = '';
  error = '';
  saved = false;

  prefsLoading = true;
  prefsError = '';
  prefs: NotificationPreferences | null = null;
  remindersEnabled = true;

  pushError = '';
  pushEnabling = false;

  ngOnInit(): void {
    this.auth.loadProfile().subscribe((u) => {
      if (!u) return;
      this.name = u.name ?? '';
      this.email = u.email;
      this.phone = u.phone ?? '';
    });

    this.prefsApi.getPreferences().subscribe({
      next: (p) => {
        this.prefs = p;
        this.remindersEnabled = Boolean(p.remindersEnabled);
        this.prefsLoading = false;
      },
      error: () => {
        this.prefsLoading = false;
        this.prefsError = 'Could not load notification settings.';
      },
    });
  }

  save(): void {
    this.error = '';
    this.saved = false;
    this.auth
      .updateProfile({
        name: this.name || undefined,
        email: this.email || undefined,
        phone: this.phone || undefined,
      })
      .subscribe({
        next: () => {
          this.saved = true;
        },
        error: (e) => {
          this.error =
            typeof e?.error?.message === 'string' ? e.error.message : 'Could not update profile';
        },
      });
  }

  logout(): void {
    this.auth.logout().subscribe();
  }

  async enablePush(): Promise<void> {
    this.pushError = '';
    this.pushEnabling = true;
    try {
      await this.push.enablePush();
    } catch (e) {
      this.pushError = e instanceof Error ? e.message : 'Could not enable push notifications';
    } finally {
      this.pushEnabling = false;
    }
  }

  setRemindersEnabled(value: boolean): void {
    this.remindersEnabled = value;
    this.prefsError = '';
    this.prefsApi.updatePreferences({ remindersEnabled: value }).subscribe({
      next: (p) => {
        this.prefs = p;
        this.remindersEnabled = Boolean(p.remindersEnabled);
      },
      error: () => {
        this.prefsError = 'Could not update notification settings.';
      },
    });
  }
}
