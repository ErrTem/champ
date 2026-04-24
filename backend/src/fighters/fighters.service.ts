import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FighterListItemDto } from './dto/fighter-list-item.dto';
import { FighterProfileDto } from './dto/fighter-profile.dto';
import { ServiceDto } from './dto/service.dto';

@Injectable()
export class FightersService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(): Promise<FighterListItemDto[]> {
    const fighters = await this.prisma.fighter.findMany({
      where: { published: true },
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
      services,
    };
  }
}

