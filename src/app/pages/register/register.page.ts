import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
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
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  confirm = '';
  name = '';
  phone = '';
  error = '';

  submit(): void {
    if (this.password !== this.confirm) {
      this.error = 'Passwords do not match';
      return;
    }
    this.error = '';
    this.auth
      .register({
        email: this.email,
        password: this.password,
        name: this.name || undefined,
        phone: this.phone || undefined,
      })
      .subscribe({
        next: () => void this.router.navigateByUrl('/profile'),
        error: (e) => {
          this.error =
            typeof e?.error?.message === 'string' ? e.error.message : 'Could not create account';
        },
      });
  }
}
