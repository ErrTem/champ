import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  email = '';
  password = '';
  error = '';

  submit(): void {
    this.error = '';
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        const returnTo = this.route.snapshot.queryParamMap.get('returnTo');
        if (returnTo && this.isSafeReturnTo(returnTo)) {
          void this.router.navigateByUrl(returnTo);
          return;
        }
        void this.router.navigateByUrl('/explore');
      },
      error: () => {
        this.error = 'Invalid email or password';
      },
    });
  }

  private isSafeReturnTo(value: string): boolean {
    return value.startsWith('/') && !value.startsWith('//');
  }
}
