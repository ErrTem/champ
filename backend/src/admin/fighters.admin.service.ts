import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdminFighterDto,
  CreateAdminFighterDto,
  UpdateAdminFighterDto,
} from './dto/admin-fighter.dto';

@Injectable()
export class FightersAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(): Promise<AdminFighterDto[]> {
    const fighters = await this.prisma.fighter.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        summary: true,
        bio: true,
        photoUrl: true,
        disciplines: true,
        published: true,
      },
    });

    return fighters.map((f) => ({
      id: f.id,
      name: f.name,
      summary: f.summary,
      bio: f.bio,
      photoUrl: f.photoUrl ?? null,
      disciplines: f.disciplines ?? [],
      published: f.published,
    }));
  }

  async create(dto: CreateAdminFighterDto): Promise<AdminFighterDto> {
    const created = await this.prisma.fighter.create({
      data: {
        name: dto.name,
        summary: dto.summary ?? '',
        bio: dto.bio ?? '',
        photoUrl: dto.photoUrl,
        disciplines: dto.disciplines ?? [],
        mediaUrls: [],
        published: dto.published ?? false,
      },
      select: {
        id: true,
        name: true,
        summary: true,
        bio: true,
        photoUrl: true,
        disciplines: true,
        published: true,
      },
    });

    return {
      id: created.id,
      name: created.name,
      summary: created.summary,
      bio: created.bio,
      photoUrl: created.photoUrl ?? null,
      disciplines: created.disciplines ?? [],
      published: created.published,
    };
  }

  async update(fighterId: string, dto: UpdateAdminFighterDto): Promise<AdminFighterDto> {
    const updated = await this.prisma.fighter.update({
      where: { id: fighterId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary ?? '' } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio ?? '' } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
        ...(dto.disciplines !== undefined ? { disciplines: dto.disciplines ?? [] } : {}),
        ...(dto.published !== undefined ? { published: dto.published } : {}),
      },
      select: {
        id: true,
        name: true,
        summary: true,
        bio: true,
        photoUrl: true,
        disciplines: true,
        published: true,
      },
    });

    if (!updated) throw new NotFoundException();

    return {
      id: updated.id,
      name: updated.name,
      summary: updated.summary,
      bio: updated.bio,
      photoUrl: updated.photoUrl ?? null,
      disciplines: updated.disciplines ?? [],
      published: updated.published,
    };
  }
}

