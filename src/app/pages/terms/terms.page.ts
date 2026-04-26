import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.page.html',
  styleUrls: ['./terms.page.scss'],
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class TermsPage {}

