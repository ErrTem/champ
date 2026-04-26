import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle],
})
export class HeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() showBack: boolean | undefined = true;
}

