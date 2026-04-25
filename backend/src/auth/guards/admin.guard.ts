import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type JwtUser = { sub: string; email: string };

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isAdmin: true },
    });
    if (!user?.isAdmin) throw new ForbiddenException();

    return true;
  }
}

