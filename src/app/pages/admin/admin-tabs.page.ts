import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  IonContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-admin-tabs',
  templateUrl: './admin-tabs.page.html',
  styleUrls: ['./admin-tabs.page.scss'],
  imports: [
    CommonModule,
    RouterOutlet,
    IonContent,
  ],
})
export class AdminTabsPage {}

