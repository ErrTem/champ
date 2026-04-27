import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type JwtUser = { sub: string; email: string };

@Injectable()
export class FighterApprovedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true, fighterStatus: true },
    });

    if (!user) throw new ForbiddenException();
    if (user.userType !== 'fighter') throw new ForbiddenException();
    if (user.fighterStatus !== 'approved') throw new ForbiddenException();

    return true;
  }
}

