import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonSkeletonText,
  IonSelect,
  IonSelectOption,
  IonText,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { FighterListItem } from '../../core/models/catalog.models';
import { CatalogService, FightersFilters } from '../../core/services/catalog.service';
import { HeaderComponent } from '../../shell/header.component';

type PriceBucket = 'any' | 'under50' | '50to100' | '100plus';
type ModalityBucket = 'any' | 'online' | 'in_person';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
  imports: [
    CommonModule,
    RouterLink,
    HeaderComponent,
    IonContent,
    IonText,
    IonButton,
    IonLabel,
    IonSkeletonText,
    IonIcon,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonSelect,
    IonSelectOption,
  ],
})
export class CatalogPage {
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly disciplineOptions = ['any', 'MMA', 'Boxing', 'Muay Thai', 'Wrestling', 'BJJ'] as const;
  readonly modalityOptions: Array<{ value: ModalityBucket; label: string }> = [
    { value: 'any', label: 'Any' },
    { value: 'online', label: 'Online' },
    { value: 'in_person', label: 'In person' },
  ];
  readonly priceOptions: Array<{ value: PriceBucket; label: string }> = [
    { value: 'any', label: 'Any' },
    { value: 'under50', label: 'Under $50' },
    { value: '50to100', label: '$50–$100' },
    { value: '100plus', label: '$100+' },
  ];

  loading = true;
  error = '';
  fighters: FighterListItem[] = [];

  selectedDiscipline: string | null = null;
  selectedModality: ModalityBucket = 'any';
  selectedPrice: PriceBucket = 'any';

  private qpSub?: { unsubscribe(): void };

  ionViewWillEnter(): void {
    this.qpSub?.unsubscribe();
    this.qpSub = this.route.queryParamMap.subscribe((qpm) => {
      const discipline = qpm.getAll('discipline').filter(Boolean);
      this.selectedDiscipline = discipline.length ? discipline[0]! : null;

      const modality = qpm.getAll('modality').filter((m) => m === 'online' || m === 'in_person');
      this.selectedModality = (modality[0] as ModalityBucket | undefined) ?? 'any';

      const minPriceCents = qpm.get('minPriceCents');
      const maxPriceCents = qpm.get('maxPriceCents');
      const min = minPriceCents ? Number.parseInt(minPriceCents, 10) : null;
      const max = maxPriceCents ? Number.parseInt(maxPriceCents, 10) : null;
      this.selectedPrice = this.bucketFromPriceParams({
        minPriceCents: Number.isFinite(min ?? NaN) ? (min as number) : null,
        maxPriceCents: Number.isFinite(max ?? NaN) ? (max as number) : null,
      });

      this.fetch();
    });
  }

  ionViewDidLeave(): void {
    this.qpSub?.unsubscribe();
    this.qpSub = undefined;
  }

  fetch(): void {
    this.loading = true;
    this.error = '';

    this.catalog
      .getFighters(this.buildFilters())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (fighters) => (this.fighters = fighters ?? []),
        error: () => {
          this.fighters = [];
          this.error = "Couldn’t load fighters. Check your connection and try again.";
        },
      });
  }

  setDiscipline(value: string): void {
    const discipline = value === 'any' ? null : value;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        discipline: discipline ? [discipline] : null,
      },
      queryParamsHandling: 'merge',
    });
  }

  setModality(value: ModalityBucket): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { modality: value === 'any' ? null : [value] },
      queryParamsHandling: 'merge',
    });
  }

  setPrice(bucket: PriceBucket): void {
    const qp = this.priceParamsFromBucket(bucket);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        minPriceCents: qp.minPriceCents,
        maxPriceCents: qp.maxPriceCents,
      },
      queryParamsHandling: 'merge',
    });
  }

  resetFilters(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        discipline: null,
        modality: null,
        minPriceCents: null,
        maxPriceCents: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  filtersSummary(): string {
    const parts: string[] = [];
    if (this.selectedDiscipline) parts.push(this.selectedDiscipline);
    if (this.selectedModality !== 'any') parts.push(this.selectedModality === 'online' ? 'Online' : 'In person');
    if (this.selectedPrice !== 'any') parts.push(this.priceOptions.find((p) => p.value === this.selectedPrice)?.label ?? '');
    const out = parts.filter(Boolean).join(' · ');
    return out || 'No filters';
  }

  private buildFilters(): FightersFilters {
    const price = this.priceParamsFromBucket(this.selectedPrice);
    return {
      minPriceCents: price.minPriceCents ?? undefined,
      maxPriceCents: price.maxPriceCents ?? undefined,
      disciplines: this.selectedDiscipline ? [this.selectedDiscipline] : [],
      modalities: this.selectedModality === 'any' ? [] : [this.selectedModality],
    };
  }

  private priceParamsFromBucket(bucket: PriceBucket): { minPriceCents: number | null; maxPriceCents: number | null } {
    if (bucket === 'under50') return { minPriceCents: null, maxPriceCents: 5000 };
    if (bucket === '50to100') return { minPriceCents: 5000, maxPriceCents: 10000 };
    if (bucket === '100plus') return { minPriceCents: 10000, maxPriceCents: null };
    return { minPriceCents: null, maxPriceCents: null };
  }

  private bucketFromPriceParams(input: {
    minPriceCents: number | null;
    maxPriceCents: number | null;
  }): PriceBucket {
    const { minPriceCents, maxPriceCents } = input;
    if (minPriceCents === null && maxPriceCents === 5000) return 'under50';
    if (minPriceCents === 5000 && maxPriceCents === 10000) return '50to100';
    if (minPriceCents === 10000 && maxPriceCents === null) return '100plus';
    return 'any';
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

