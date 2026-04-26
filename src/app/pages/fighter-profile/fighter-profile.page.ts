import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonSkeletonText,
  IonText,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { FighterProfile, Service } from '../../core/models/catalog.models';
import { CatalogService } from '../../core/services/catalog.service';
import { HeaderComponent } from '../../shell/header.component';

@Component({
  selector: 'app-fighter-profile',
  templateUrl: './fighter-profile.page.html',
  styleUrls: ['./fighter-profile.page.scss'],
  imports: [
    HeaderComponent,
    IonContent,
    IonText,
    IonSkeletonText,
    IonFooter,
    IonButton,
  ],
})
export class FighterProfilePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);

  loading = true;
  error = '';
  fighter: FighterProfile | null = null;
  selectedServiceId: string | null = null;

  ionViewWillEnter(): void {
    this.fetch();
  }

  fetch(): void {
    const fighterId = this.route.snapshot.paramMap.get('fighterId');
    if (!fighterId) {
      this.loading = false;
      this.error = 'Missing fighter id.';
      this.fighter = null;
      return;
    }

    this.loading = true;
    this.error = '';
    this.selectedServiceId = null;

    this.catalog
      .getFighterProfile(fighterId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (fighter) => (this.fighter = fighter),
        error: () => {
          this.fighter = null;
          this.error = "Couldn’t load fighter. Check your connection and try again.";
        },
      });
  }

  formatUsd(cents: number): string {
    const dollars = Math.round(cents / 100);
    return `$${dollars}`;
  }

  modalityLabel(modality: string): string {
    if (modality === 'online') return 'Online';
    if (modality === 'in_person') return 'In person';
    return modality;
  }

  selectService(service: Service): void {
    this.selectedServiceId = service.id;
    const fighterId = this.route.snapshot.paramMap.get('fighterId');
    if (!fighterId) return;

    void this.router.navigate(['/book'], {
      queryParams: { fighterId, serviceId: service.id },
    });
  }

  bookSelected(): void {
    const fighterId = this.route.snapshot.paramMap.get('fighterId');
    if (!fighterId || !this.selectedServiceId) return;

    void this.router.navigate(['/book'], {
      queryParams: { fighterId, serviceId: this.selectedServiceId },
    });
  }
}

