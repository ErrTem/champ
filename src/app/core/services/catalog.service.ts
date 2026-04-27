import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FighterListItem, FighterProfile, Service } from '../models/catalog.models';

const MOCK_FIGHTERS: FighterProfile[] = [
  {
    id: 'ftr_ali_01',
    name: 'Alicia “Iron” Vega',
    photoUrl:
      'https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=1200&q=60',
    bio: 'Alicia is known for clean combinations, disciplined defense, and fight IQ. Sessions focus on striking fundamentals, timing, and building repeatable habits.',
    disciplines: ['Muay Thai', 'Boxing'],
    mediaUrls: [],
    wins: 12,
    losses: 3,
    draws: 1,
    yearsPro: 6,
    services: [
      {
        id: 'svc_ali_30_ol',
        title: '1:1 Striking (30 min)',
        durationMinutes: 30,
        modality: 'online',
        priceCents: 5000,
        currency: 'USD',
      },
      {
        id: 'svc_ali_60_ip',
        title: '1:1 Striking (60 min)',
        durationMinutes: 60,
        modality: 'in_person',
        priceCents: 9500,
        currency: 'USD',
      },
    ],
  },
  {
    id: 'ftr_noah_01',
    name: 'Noah “Lockdown” Kim',
    photoUrl:
      'https://images.unsplash.com/photo-1599058917765-889172d3d66b?auto=format&fit=crop&w=1200&q=60',
    bio: 'Noah teaches efficient takedown chains, positional control, and high-percentage submissions. Great for beginners building confidence on the ground.',
    disciplines: ['BJJ', 'Wrestling'],
    mediaUrls: [],
    wins: 9,
    losses: 2,
    draws: 0,
    yearsPro: 5,
    services: [
      {
        id: 'svc_noah_45_ol',
        title: 'BJJ Drills (45 min)',
        durationMinutes: 45,
        modality: 'online',
        priceCents: 6500,
        currency: 'USD',
      },
      {
        id: 'svc_noah_60_ip',
        title: 'Takedowns & Control (60 min)',
        durationMinutes: 60,
        modality: 'in_person',
        priceCents: 10500,
        currency: 'USD',
      },
    ],
  },
  {
    id: 'ftr_maya_01',
    name: 'Maya “Pulse” Rios',
    photoUrl: null,
    bio: 'Maya blends fight conditioning with movement quality. Sessions are tailored to your goals, whether it’s endurance, explosiveness, or return-to-training.',
    disciplines: ['Strength & Conditioning'],
    mediaUrls: [],
    wins: 3,
    losses: 1,
    draws: 0,
    yearsPro: 2,
    services: [
      {
        id: 'svc_maya_30_ol',
        title: 'Fight Conditioning (30 min)',
        durationMinutes: 30,
        modality: 'online',
        priceCents: 4500,
        currency: 'USD',
      },
      {
        id: 'svc_maya_60_ip',
        title: 'Movement + Conditioning (60 min)',
        durationMinutes: 60,
        modality: 'in_person',
        priceCents: 9000,
        currency: 'USD',
      },
    ],
  },
  {
    id: 'ftr_sam_01',
    name: 'Sam “Southpaw” Okoye',
    photoUrl:
      'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=1200&q=60',
    bio: 'Sam focuses on angles, feints, and countering. Sessions cover stance-specific strategies and building a reliable gameplan you can execute under pressure.',
    disciplines: ['Kickboxing', 'Boxing'],
    mediaUrls: [],
    wins: 7,
    losses: 4,
    draws: 0,
    yearsPro: 4,
    services: [
      {
        id: 'svc_sam_30_ol',
        title: 'Southpaw Basics (30 min)',
        durationMinutes: 30,
        modality: 'online',
        priceCents: 4800,
        currency: 'USD',
      },
      {
        id: 'svc_sam_60_ip',
        title: 'Counters & Angles (60 min)',
        durationMinutes: 60,
        modality: 'in_person',
        priceCents: 9800,
        currency: 'USD',
      },
    ],
  },
];

function minPriceCents(services: Service[]): number | null {
  if (!services.length) return null;
  return Math.min(...services.map((s) => s.priceCents));
}

export type FightersFilters = {
  minPriceCents?: number;
  maxPriceCents?: number;
  disciplines?: string[];
  modalities?: Array<'online' | 'in_person'>;
};

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getFighters(filters?: FightersFilters): Observable<FighterListItem[]> {
    const normalized: FightersFilters = {
      minPriceCents: filters?.minPriceCents,
      maxPriceCents: filters?.maxPriceCents,
      disciplines: (filters?.disciplines ?? []).filter(Boolean),
      modalities: (filters?.modalities ?? []).filter((m) => m === 'online' || m === 'in_person'),
    };

    if (environment.mockCatalog) {
      const fighters = MOCK_FIGHTERS.filter((f) => {
        const hasDisciplines =
          normalized.disciplines && normalized.disciplines.length
            ? (f.disciplines ?? []).some((d) => normalized.disciplines!.includes(d))
            : true;
        if (!hasDisciplines) return false;

        const needsServiceConstraint =
          normalized.minPriceCents !== undefined ||
          normalized.maxPriceCents !== undefined ||
          (normalized.modalities?.length ?? 0) > 0;
        if (!needsServiceConstraint) return true;

        return f.services.some((s) => {
          if (normalized.minPriceCents !== undefined && s.priceCents < normalized.minPriceCents) return false;
          if (normalized.maxPriceCents !== undefined && s.priceCents > normalized.maxPriceCents) return false;
          if (normalized.modalities && normalized.modalities.length > 0) {
            if (s.modality !== 'online' && s.modality !== 'in_person') return false;
            if (!normalized.modalities.includes(s.modality)) return false;
          }
          return true;
        });
      })
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));

      return of(
        fighters.map((f) => ({
          id: f.id,
          name: f.name,
          photoUrl: f.photoUrl ?? null,
          summary: f.bio,
          fromPriceCents: minPriceCents(f.services),
          disciplines: f.disciplines,
        })),
      );
    }

    let params = new HttpParams();
    if (normalized.minPriceCents !== undefined) params = params.set('minPriceCents', String(normalized.minPriceCents));
    if (normalized.maxPriceCents !== undefined) params = params.set('maxPriceCents', String(normalized.maxPriceCents));
    for (const d of normalized.disciplines ?? []) {
      params = params.append('discipline', d);
    }
    for (const m of normalized.modalities ?? []) {
      params = params.append('modality', m);
    }

    return this.http.get<FighterListItem[]>(`${this.baseUrl}/fighters`, {
      withCredentials: true,
      params,
    });
  }

  getFighterProfile(fighterId: string): Observable<FighterProfile> {
    if (environment.mockCatalog) {
      const fighter = MOCK_FIGHTERS.find((f) => f.id === fighterId);
      return fighter ? of(fighter) : throwError(() => new Error('Not found'));
    }
    return this.http.get<FighterProfile>(`${this.baseUrl}/fighters/${fighterId}`, {
      withCredentials: true,
    });
  }
}

