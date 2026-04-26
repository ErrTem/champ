import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

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
    IonItem,
    IonLabel,
    IonCheckbox,
    IonSegment,
    IonSegmentButton,
    IonText,
  ],
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly apiUrl = environment.apiUrl;

  email = '';
  password = '';
  confirm = '';
  name = '';
  phone = '';
  acceptedTerms = false;
  confirmedAdult = false;
  profileType: 'user' | 'fighter' | '' = '';
  error = '';

  private digitsOnly(v: string): string {
    return (v ?? '').replace(/\D/g, '');
  }

  private formatUsPhone(digits: string): string {
    const d = digits.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }

  onPhoneInput(value: string | number | null | undefined): void {
    const digits = this.digitsOnly(String(value ?? ''));
    this.phone = this.formatUsPhone(digits);
  }

  private phoneE164(): string | null {
    const digits = this.digitsOnly(this.phone);
    const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    if (ten.length !== 10) return null;
    return `+1${ten}`;
  }

  get canSubmit(): boolean {
    return (
      !!this.email.trim() &&
      this.password.length >= 8 &&
      this.password === this.confirm &&
      this.phoneE164() !== null &&
      this.acceptedTerms === true &&
      this.confirmedAdult === true &&
      (this.profileType === 'user' || this.profileType === 'fighter')
    );
  }

  oauth(provider: 'google' | 'apple'): void {
    window.location.href = `${this.apiUrl}/auth/${provider}`;
  }

  submit(): void {
    if (this.password !== this.confirm) {
      this.error = 'Passwords do not match';
      return;
    }
    const phone = this.phoneE164();
    if (!phone) {
      this.error = 'Enter valid US phone number';
      return;
    }
    if (!this.acceptedTerms || !this.confirmedAdult) {
      this.error = 'Confirm age and accept terms to continue';
      return;
    }
    if (this.profileType !== 'user' && this.profileType !== 'fighter') {
      this.error = 'Choose profile type to continue';
      return;
    }
    this.error = '';
    this.auth
      .register({
        email: this.email,
        password: this.password,
        name: this.name || undefined,
        phone,
        acceptedTerms: true,
        confirmedAdult: true,
        profileType: this.profileType,
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
