import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdminServiceDto,
  CreateAdminServiceDto,
  UpdateAdminServiceDto,
} from './dto/admin-service.dto';

@Injectable()
export class ServicesAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listForFighter(fighterId: string): Promise<AdminServiceDto[]> {
    const rows = await this.prisma.service.findMany({
      where: { fighterId },
      orderBy: [{ priceCents: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        fighterId: true,
        title: true,
        durationMinutes: true,
        modality: true,
        priceCents: true,
        currency: true,
        published: true,
      },
    });

    return rows.map((s) => ({
      id: s.id,
      fighterId: s.fighterId,
      title: s.title,
      durationMinutes: s.durationMinutes,
      modality: s.modality,
      priceCents: s.priceCents,
      currency: s.currency,
      published: s.published,
    }));
  }

  async createForFighter(fighterId: string, dto: CreateAdminServiceDto): Promise<AdminServiceDto> {
    const created = await this.prisma.service.create({
      data: {
        fighterId,
        title: dto.title,
        durationMinutes: dto.durationMinutes,
        modality: dto.modality,
        priceCents: dto.priceCents,
        currency: dto.currency ?? 'USD',
        published: dto.published ?? false,
      },
      select: {
        id: true,
        fighterId: true,
        title: true,
        durationMinutes: true,
        modality: true,
        priceCents: true,
        currency: true,
        published: true,
      },
    });

    return {
      id: created.id,
      fighterId: created.fighterId,
      title: created.title,
      durationMinutes: created.durationMinutes,
      modality: created.modality,
      priceCents: created.priceCents,
      currency: created.currency,
      published: created.published,
    };
  }

  async update(serviceId: string, dto: UpdateAdminServiceDto): Promise<AdminServiceDto> {
    const existing = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, fighterId: true },
    });
    if (!existing) throw new NotFoundException('Service not found');

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.durationMinutes !== undefined ? { durationMinutes: dto.durationMinutes } : {}),
        ...(dto.modality !== undefined ? { modality: dto.modality } : {}),
        ...(dto.priceCents !== undefined ? { priceCents: dto.priceCents } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency ?? 'USD' } : {}),
        ...(dto.published !== undefined ? { published: dto.published } : {}),
      },
      select: {
        id: true,
        fighterId: true,
        title: true,
        durationMinutes: true,
        modality: true,
        priceCents: true,
        currency: true,
        published: true,
      },
    });

    return {
      id: updated.id,
      fighterId: updated.fighterId,
      title: updated.title,
      durationMinutes: updated.durationMinutes,
      modality: updated.modality,
      priceCents: updated.priceCents,
      currency: updated.currency,
      published: updated.published,
    };
  }
}

