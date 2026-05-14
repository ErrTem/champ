import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonRadio,
  IonRadioGroup,
  IonText,
} from '@ionic/angular/standalone';
import { PasswordVisibilityToggleComponent } from '../../components/password-visibility-toggle.component';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

function usPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '');
    const digits = raw.replace(/\D/g, '');
    const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    if (ten.length === 0) return null;
    return ten.length === 10 ? null : { usPhone: true };
  };
}

function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    if (!(group instanceof FormGroup)) return null;
    const password = group.get('password')?.value as string | undefined;
    const confirm = group.get('confirm')?.value as string | undefined;
    if (password == null || confirm == null || password === '' || confirm === '') {
      return null;
    }
    return password === confirm ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    ReactiveFormsModule,
    PasswordVisibilityToggleComponent,
    RouterLink,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonRadio,
    IonRadioGroup,
    IonText,
  ],
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly apiUrl = environment.apiUrl;

  readonly form = this.fb.group(
    {
      profileType: this.fb.control<'user' | 'fighter' | ''>('', {
        validators: [Validators.required],
      }),
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, usPhoneValidator()]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
      confirmedAdult: [false, [Validators.requiredTrue]],
      acceptedTerms: [false, [Validators.requiredTrue]],
    },
    { validators: [passwordsMatchValidator()], updateOn: 'change' },
  );

  error = '';
  passwordVisible = false;
  confirmPasswordVisible = false;

  private digitsOnly(v: string): string {
    return (v ?? '').replace(/\D/g, '');
  }

  private formatUsPhone(digits: string): string {
    const d = digits.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }

  onPhoneIonInput(ev: { detail?: { value?: string | null } }): void {
    let digits = this.digitsOnly(String(ev.detail?.value ?? ''));
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    const formatted = this.formatUsPhone(digits);
    const phoneCtrl = this.form.controls.phone;
    if (formatted !== phoneCtrl.value) {
      phoneCtrl.setValue(formatted);
    }
  }

  invalidShow(controlName: string): boolean {
    const c = this.form.get(controlName);
    return !!c && c.invalid && c.touched;
  }

  invalidProfileType(): boolean {
    const c = this.form.controls.profileType;
    return c.invalid && c.touched;
  }

  passwordMismatchShow(): boolean {
    const p = this.form.controls.password;
    const c = this.form.controls.confirm;
    return (
      !!this.form.errors?.['passwordMismatch'] &&
      (p.touched || c.touched) &&
      (p.value !== '' || c.value !== '')
    );
  }

  checkboxInvalidShow(controlName: 'confirmedAdult' | 'acceptedTerms'): boolean {
    const ctrl = this.form.get(controlName);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }

  private phoneE164(phoneDisplay: string): string | null {
    const digits = this.digitsOnly(phoneDisplay);
    const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    if (ten.length !== 10) return null;
    return `+1${ten}`;
  }

  oauth(provider: 'google' | 'apple'): void {
    window.location.href = `${this.apiUrl}/auth/${provider}`;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const phoneDisplay = v.phone ?? '';
    const phone = this.phoneE164(phoneDisplay);
    if (!phone) {
      this.error = 'Enter valid US phone number';
      return;
    }
    if (v.profileType !== 'user' && v.profileType !== 'fighter') {
      this.error = 'Choose profile type to continue';
      return;
    }
    const email = (v.email ?? '').trim();
    const password = v.password ?? '';
    this.error = '';
    this.auth
      .register({
        email,
        password,
        name: (v.name ?? '').trim() || undefined,
        phone,
        acceptedTerms: true,
        confirmedAdult: true,
        profileType: v.profileType,
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
