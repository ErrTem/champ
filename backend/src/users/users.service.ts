import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findSafeById(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException();
    const { passwordHash: _p, ...safe } = user;
    return safe;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email.toLowerCase(), NOT: { id: userId } },
      });
      if (existing) throw new ConflictException('Email already in use');
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
    });
    const { passwordHash: _p, ...safe } = user;
    return safe;
  }
}
