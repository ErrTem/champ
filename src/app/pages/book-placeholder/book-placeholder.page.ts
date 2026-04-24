import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { FighterProfile, Service } from '../../core/models/catalog.models';
import { CatalogService } from '../../core/services/catalog.service';

@Component({
  selector: 'app-book-placeholder',
  templateUrl: './book-placeholder.page.html',
  styleUrls: ['./book-placeholder.page.scss'],
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonText, IonSkeletonText, IonButton],
})
export class BookPlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);

  loading = true;
  error = '';

  fighterId: string | null = null;
  serviceId: string | null = null;

  fighter: FighterProfile | null = null;
  service: Service | null = null;

  ionViewWillEnter(): void {
    this.loadFromUrl();
  }

  loadFromUrl(): void {
    this.fighterId = this.route.snapshot.queryParamMap.get('fighterId');
    this.serviceId = this.route.snapshot.queryParamMap.get('serviceId');

    if (!this.fighterId || !this.serviceId) {
      this.loading = false;
      this.error = 'Missing selection.';
      this.fighter = null;
      this.service = null;
      return;
    }

    this.loading = true;
    this.error = '';
    this.fighter = null;
    this.service = null;

    this.catalog
      .getFighterProfile(this.fighterId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (fighter) => {
          this.fighter = fighter;
          this.service = fighter.services.find((s) => s.id === this.serviceId) ?? null;
          if (!this.service) {
            this.error = 'Selected service not found.';
          }
        },
        error: () => {
          this.error = "Couldn’t load selection. Check your connection and try again.";
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

  backToExplore(): void {
    void this.router.navigateByUrl('/explore');
  }

  backToProfile(): void {
    if (!this.fighterId) return;
    void this.router.navigateByUrl(`/fighters/${encodeURIComponent(this.fighterId)}`);
  }
}

