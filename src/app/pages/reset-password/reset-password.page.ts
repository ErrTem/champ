import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
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
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
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
export class ResetPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly token = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('token') ?? '')), {
    initialValue: '',
  });

  password = '';
  confirm = '';
  error = '';

  submit(): void {
    const token = this.token();
    if (!token) {
      this.error = 'Missing token';
      return;
    }
    if (this.password !== this.confirm) {
      this.error = 'Passwords do not match';
      return;
    }
    this.error = '';
    this.auth.resetPassword(token, this.password).subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => {
        this.error = 'Reset failed — link may be expired';
      },
    });
  }
}
