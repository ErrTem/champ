import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FighterListItemDto } from './dto/fighter-list-item.dto';
import { FighterProfileDto } from './dto/fighter-profile.dto';
import { ServiceDto } from './dto/service.dto';
import { GymDto } from '../gyms/dto/gym.dto';

type FightersListFilters = {
  minPriceCents: number | null;
  maxPriceCents: number | null;
  disciplines: string[];
  modalities: Array<'online' | 'in_person'>;
};

@Injectable()
export class FightersService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(): Promise<FighterListItemDto[]> {
    return this.listPublishedFiltered({
      minPriceCents: null,
      maxPriceCents: null,
      disciplines: [],
      modalities: [],
    });
  }

  async listPublishedFiltered(filters: FightersListFilters): Promise<FighterListItemDto[]> {
    const { minPriceCents, maxPriceCents, disciplines, modalities } = filters;

    const serviceLevel: {
      published: true;
      priceCents?: { gte?: number; lte?: number };
      modality?: { in: Array<'online' | 'in_person'> };
    } = { published: true };

    const priceCents: { gte?: number; lte?: number } = {};
    if (minPriceCents !== null) priceCents.gte = minPriceCents;
    if (maxPriceCents !== null) priceCents.lte = maxPriceCents;
    if (Object.keys(priceCents).length > 0) serviceLevel.priceCents = priceCents;

    if (modalities.length > 0) serviceLevel.modality = { in: modalities };

    const where: Record<string, unknown> = { published: true };
    if (disciplines.length > 0) {
      where.disciplines = { hasSome: disciplines };
    }
    const hasServiceConstraints = Object.keys(serviceLevel).length > 1;
    if (hasServiceConstraints) {
      where.services = { some: serviceLevel };
    }

    const fighters = await this.prisma.fighter.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        summary: true,
        disciplines: true,
        services: {
          where: { published: true },
          select: { priceCents: true },
        },
      },
    });

    return fighters.map((f) => {
      const fromPriceCents =
        f.services.length === 0 ? null : Math.min(...f.services.map((s) => s.priceCents));

      return {
        id: f.id,
        name: f.name,
        photoUrl: f.photoUrl ?? null,
        summary: f.summary,
        disciplines: f.disciplines ?? [],
        fromPriceCents,
      };
    });
  }

  async getPublishedProfile(fighterId: string): Promise<FighterProfileDto> {
    const fighter = await this.prisma.fighter.findFirst({
      where: { id: fighterId, published: true },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        bio: true,
        disciplines: true,
        mediaUrls: true,
        wins: true,
        losses: true,
        draws: true,
        yearsPro: true,
        gym: {
          select: {
            id: true,
            name: true,
            timezone: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            countryCode: true,
          },
        },
        services: {
          where: { published: true },
          orderBy: { priceCents: 'asc' },
          select: {
            id: true,
            title: true,
            durationMinutes: true,
            modality: true,
            priceCents: true,
            currency: true,
          },
        },
      },
    });

    if (!fighter) {
      throw new NotFoundException('Fighter not found');
    }

    const services: ServiceDto[] = fighter.services.map((s) => ({
      id: s.id,
      title: s.title,
      durationMinutes: s.durationMinutes,
      modality: s.modality,
      priceCents: s.priceCents,
      currency: s.currency,
    }));

    const gym: GymDto = {
      id: fighter.gym.id,
      name: fighter.gym.name,
      timezone: fighter.gym.timezone,
      addressLine1: fighter.gym.addressLine1,
      addressLine2: fighter.gym.addressLine2 ?? null,
      city: fighter.gym.city,
      state: fighter.gym.state,
      postalCode: fighter.gym.postalCode,
      countryCode: fighter.gym.countryCode,
    };

    return {
      id: fighter.id,
      name: fighter.name,
      photoUrl: fighter.photoUrl ?? null,
      bio: fighter.bio,
      disciplines: fighter.disciplines ?? [],
      mediaUrls: fighter.mediaUrls ?? [],
      wins: fighter.wins,
      losses: fighter.losses,
      draws: fighter.draws,
      yearsPro: fighter.yearsPro,
      gym,
      services,
    };
  }
}

