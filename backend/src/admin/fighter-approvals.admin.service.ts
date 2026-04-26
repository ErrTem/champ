import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type FighterApprovalRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  fighterStatus: string;
  createdAt: Date;
};

@Injectable()
export class FighterApprovalsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status: 'pending'): Promise<FighterApprovalRow[]> {
    if (status !== 'pending') throw new BadRequestException('Unsupported status filter');

    return this.prisma.user.findMany({
      where: { userType: 'fighter', fighterStatus: 'pending' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        fighterStatus: true,
        createdAt: true,
      },
    });
  }

  async approve(userId: string): Promise<{ ok: true }> {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, userType: true, fighterStatus: true, name: true, email: true },
      });
      if (!user) throw new NotFoundException();
      if (user.userType !== 'fighter' || user.fighterStatus !== 'pending') {
        throw new BadRequestException('User not pending fighter');
      }

      await tx.user.update({
        where: { id: userId },
        data: { fighterStatus: 'approved', fighterApprovedAt: new Date() },
        select: { id: true },
      });

      const existingFighter = await tx.fighter.findFirst({
        where: { userId: userId },
        select: { id: true },
      });
      if (!existingFighter) {
        const fallbackName = user.name?.trim() || user.email.split('@')[0] || 'New Fighter';
        await tx.fighter.create({
          data: {
            userId: userId,
            published: false,
            name: fallbackName,
            summary: '',
            bio: '',
            photoUrl: null,
            disciplines: [],
            mediaUrls: [],
            wins: 0,
            losses: 0,
            draws: 0,
            yearsPro: 0,
          },
          select: { id: true },
        });
      }
    });
    return { ok: true as const };
  }
}

