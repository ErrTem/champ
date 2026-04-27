import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonSkeletonText,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { FighterProfile, Service } from '../../core/models/catalog.models';
import { CatalogService } from '../../core/services/catalog.service';
import { ShareService } from '../../core/services/share.service';
import { coerceSafeHttpUrl } from '../../core/utils/url-safety';
import { buildAppleMapsUrl, buildGoogleMapsSearchUrl, formatGymAddress } from '../../shared/utils/map-links';

@Component({
  selector: 'app-fighter-profile',
  templateUrl: './fighter-profile.page.html',
  styleUrls: ['./fighter-profile.page.scss'],
  imports: [
    IonContent,
    IonSkeletonText,
    IonFooter,
    IonToolbar,
    IonButton,
  ],
})
export class FighterProfilePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  private readonly share = inject(ShareService);
  private readonly toast = inject(ToastController);

  loading = true;
  error = '';
  fighter: FighterProfile | null = null;
  selectedServiceId: string | null = null;
  instagramHref: string | null = null;
  facebookHref: string | null = null;
  xHref: string | null = null;

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
        next: (fighter) => {
          this.fighter = fighter;
          this.instagramHref = coerceSafeHttpUrl(fighter.instagramUrl);
          this.facebookHref = coerceSafeHttpUrl(fighter.facebookUrl);
          this.xHref = coerceSafeHttpUrl(fighter.xUrl);
        },
        error: () => {
          this.fighter = null;
          this.error = "Couldn’t load fighter. Check your connection and try again.";
          this.instagramHref = null;
          this.facebookHref = null;
          this.xHref = null;
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

  gymAddressQuery(fighter: FighterProfile): string {
    return formatGymAddress({
      name: fighter.gym.name,
      addressLine1: fighter.gym.addressLine1,
      addressLine2: fighter.gym.addressLine2 ?? null,
      city: fighter.gym.city,
      state: fighter.gym.state,
      postalCode: fighter.gym.postalCode,
      countryCode: fighter.gym.countryCode,
    });
  }

  openAppleMaps(fighter: FighterProfile): void {
    const query = this.gymAddressQuery(fighter);
    const url = buildAppleMapsUrl(query);
    window.open(url, '_blank', 'noopener');
  }

  openGoogleMaps(fighter: FighterProfile): void {
    const query = this.gymAddressQuery(fighter);
    const url = buildGoogleMapsSearchUrl(query);
    window.open(url, '_blank', 'noopener');
  }

  async shareProfile(): Promise<void> {
    const fighterId = this.route.snapshot.paramMap.get('fighterId');
    if (!fighterId) return;
    const canonicalPath = `/explore/fighters/${encodeURIComponent(fighterId)}`;
    const url = `${window.location.origin}${canonicalPath}`;
    const title = this.fighter?.name ? `${this.fighter.name} · Champ` : 'Fighter profile · Champ';
    const res = await this.share.shareOrCopy({ title, url });

    const message =
      res.method === 'share'
        ? res.ok
          ? 'Share opened'
          : 'Couldn’t share'
        : res.ok
          ? 'Link copied'
          : 'Couldn’t copy link';

    const t = await this.toast.create({ message, duration: 1400, position: 'top' });
    await t.present();
  }
}

