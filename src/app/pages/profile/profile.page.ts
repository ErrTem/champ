import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonText,
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
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
    IonText,
  ],
})
export class ProfilePage implements OnInit {
  readonly auth = inject(AuthService);

  name = '';
  email = '';
  phone = '';
  error = '';
  saved = false;

  ngOnInit(): void {
    this.auth.loadProfile().subscribe((u) => {
      if (!u) return;
      this.name = u.name ?? '';
      this.email = u.email;
      this.phone = u.phone ?? '';
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
}
