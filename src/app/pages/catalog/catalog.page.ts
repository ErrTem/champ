import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { FighterListItem } from '../../core/models/catalog.models';
import { CatalogService } from '../../core/services/catalog.service';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonText,
    IonButton,
    IonChip,
    IonLabel,
    IonSkeletonText,
    IonIcon,
  ],
})
export class CatalogPage {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);

  readonly chips = ['All', 'MMA', 'Boxing', 'Muay Thai', 'Wrestling', 'BJJ'];

  loading = true;
  error = '';
  fighters: FighterListItem[] = [];

  ionViewWillEnter(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';

    this.catalog
      .getFighters()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (fighters) => (this.fighters = fighters ?? []),
        error: () => {
          this.fighters = [];
          this.error = "Couldn’t load fighters. Check your connection and try again.";
        },
      });
  }

  formatFrom(fromPriceCents: number | null): string {
    if (fromPriceCents === null) return 'From —';
    return `From ${this.formatUsd(fromPriceCents)}`;
  }

  formatUsd(cents: number): string {
    const dollars = Math.round(cents / 100);
    return `$${dollars}`;
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? '';
    const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return `${a}${b}`.toUpperCase();
  }

  openFighter(fighterId: string): void {
    void this.router.navigateByUrl(`/fighters/${encodeURIComponent(fighterId)}`);
  }
}

