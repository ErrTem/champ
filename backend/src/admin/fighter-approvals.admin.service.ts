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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, userType: true, fighterStatus: true },
    });
    if (!user) throw new NotFoundException();
    if (user.userType !== 'fighter' || user.fighterStatus !== 'pending') {
      throw new BadRequestException('User not pending fighter');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { fighterStatus: 'approved', fighterApprovedAt: new Date() },
      select: { id: true },
    });
    return { ok: true as const };
  }
}

