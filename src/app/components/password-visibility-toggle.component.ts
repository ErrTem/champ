import { Component, input, output } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-password-visibility-toggle',
  standalone: true,
  imports: [IonButton],
  host: {
    '[attr.slot]': "'end'",
  },
  template: `
    <ion-button
      type="button"
      fill="clear"
      class="pwd-toggle"
      (click)="onClick($event)"
      [attr.aria-label]="shown() ? ariaHidePassword() : ariaShowPassword()"
      [attr.aria-pressed]="shown()"
    >
      @if (shown()) {
      <svg
        class="pwd-toggle-svg"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
        />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
      } @else {
      <svg
        class="pwd-toggle-svg"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      }
    </ion-button>
  `,
})
export class PasswordVisibilityToggleComponent {
  readonly shown = input.required<boolean>();
  readonly toggled = output<void>();

  /** Visible label when password is hidden (tap will reveal). */
  readonly ariaShowPassword = input<string>('Show password');
  /** Visible label when password is visible (tap will mask). */
  readonly ariaHidePassword = input<string>('Hide password');

  onClick(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.toggled.emit();
  }
}
