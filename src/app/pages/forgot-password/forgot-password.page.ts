import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonInput,
    IonText,
  ],
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);

  email = '';
  message = '';
  error = '';

  submit(): void {
    this.message = '';
    this.error = '';
    this.auth.forgotPassword(this.email).subscribe({
      next: (r) => {
        this.message = r.message;
      },
      error: () => {
        this.error = 'Request failed';
      },
    });
  }
}
