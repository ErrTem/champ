import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdminFighterDto,
  CreateAdminFighterDto,
  UpdateAdminFighterDto,
} from './dto/admin-fighter.dto';

function assertSafeHttpsUrl(args: { field: string; value: string | undefined }): void {
  const { field, value } = args;
  if (value === undefined) return;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException(`${field} must be a valid https URL`);
  }
  if (url.protocol !== 'https:') {
    throw new BadRequestException(`${field} must be a valid https URL`);
  }
}

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
        instagramUrl: true,
        facebookUrl: true,
        xUrl: true,
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
      instagramUrl: f.instagramUrl ?? null,
      facebookUrl: f.facebookUrl ?? null,
      xUrl: f.xUrl ?? null,
      disciplines: f.disciplines ?? [],
      published: f.published,
    }));
  }

  async create(dto: CreateAdminFighterDto): Promise<AdminFighterDto> {
    assertSafeHttpsUrl({ field: 'instagramUrl', value: dto.instagramUrl });
    assertSafeHttpsUrl({ field: 'facebookUrl', value: dto.facebookUrl });
    assertSafeHttpsUrl({ field: 'xUrl', value: dto.xUrl });

    const created = await this.prisma.fighter.create({
      data: {
        name: dto.name,
        summary: dto.summary ?? '',
        bio: dto.bio ?? '',
        photoUrl: dto.photoUrl,
        instagramUrl: dto.instagramUrl,
        facebookUrl: dto.facebookUrl,
        xUrl: dto.xUrl,
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
        instagramUrl: true,
        facebookUrl: true,
        xUrl: true,
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
      instagramUrl: created.instagramUrl ?? null,
      facebookUrl: created.facebookUrl ?? null,
      xUrl: created.xUrl ?? null,
      disciplines: created.disciplines ?? [],
      published: created.published,
    };
  }

  async update(fighterId: string, dto: UpdateAdminFighterDto): Promise<AdminFighterDto> {
    assertSafeHttpsUrl({ field: 'instagramUrl', value: dto.instagramUrl });
    assertSafeHttpsUrl({ field: 'facebookUrl', value: dto.facebookUrl });
    assertSafeHttpsUrl({ field: 'xUrl', value: dto.xUrl });

    const updated = await this.prisma.fighter.update({
      where: { id: fighterId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary ?? '' } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio ?? '' } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
        ...(dto.instagramUrl !== undefined ? { instagramUrl: dto.instagramUrl } : {}),
        ...(dto.facebookUrl !== undefined ? { facebookUrl: dto.facebookUrl } : {}),
        ...(dto.xUrl !== undefined ? { xUrl: dto.xUrl } : {}),
        ...(dto.disciplines !== undefined ? { disciplines: dto.disciplines ?? [] } : {}),
        ...(dto.published !== undefined ? { published: dto.published } : {}),
      },
      select: {
        id: true,
        name: true,
        summary: true,
        bio: true,
        photoUrl: true,
        instagramUrl: true,
        facebookUrl: true,
        xUrl: true,
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
      instagramUrl: updated.instagramUrl ?? null,
      facebookUrl: updated.facebookUrl ?? null,
      xUrl: updated.xUrl ?? null,
      disciplines: updated.disciplines ?? [],
      published: updated.published,
    };
  }
}

