import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ConfirmResetDto } from './dto/confirm-reset.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import type { OAuthProfile } from './strategies/google.strategy';

const BCRYPT_ROUNDS = 12;
const ACCESS_TTL_SEC = 900;
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;
const RESET_MS = 60 * 60 * 1000;

/** Cookie names must match Ionic client (`access_token` / `refresh_token`). */
export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  private async issueSession(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      { expiresIn: `${ACCESS_TTL_SEC}s` },
    );
    const refreshToken = randomBytes(32).toString('hex');
    const tokenHash = sha256Hex(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_MS);
    await this.prisma.refreshSession.create({
      data: { userId, tokenHash, expiresAt },
    });
    return { accessToken, refreshToken };
  }

  private normalizeUsPhone(phone: string): string {
    const digits = (phone ?? '').replace(/\D/g, '');
    const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    if (ten.length !== 10) return phone;
    return `+1${ten}`;
  }

  async oauthLogin(profile: OAuthProfile) {
    const provider = profile.provider;
    const providerUserId = profile.providerUserId;
    const email = profile.email?.toLowerCase();
    const name = profile.name;

    const identity = await this.prisma.userOAuthIdentity.findUnique({
      where: { provider_providerUserId: { provider, providerUserId } },
      include: { user: true },
    });

    let userId: string;
    let userEmail: string;

    if (identity) {
      userId = identity.userId;
      userEmail = identity.user.email;
    } else {
      const created = await this.prisma.$transaction(async (tx) => {
        const existingUser =
          email ? await tx.user.findUnique({ where: { email } }) : null;

        const user =
          existingUser ??
          (await tx.user.create({
            data: {
              email: email ?? `oauth_${provider}_${providerUserId}@champ.local`,
              passwordHash: await bcrypt.hash(randomBytes(24).toString('hex'), BCRYPT_ROUNDS),
              name,
            },
          }));

        await tx.userOAuthIdentity.create({
          data: {
            userId: user.id,
            provider,
            providerUserId,
            providerEmail: email,
          },
        });

        return user;
      });

      userId = created.id;
      userEmail = created.email;
    }

    const tokens = await this.issueSession(userId, userEmail);
    const safe = await this.users.findSafeById(userId);
    return { user: safe, ...tokens };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const now = new Date();
    const userType = dto.profileType === 'fighter' ? 'fighter' : 'user';
    const fighterStatus = userType === 'fighter' ? 'pending' : 'none';
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name,
        phone: this.normalizeUsPhone(dto.phone),
        userType,
        fighterStatus,
        acceptedTermsAt: dto.acceptedTerms ? now : undefined,
        confirmedAdultAt: dto.confirmedAdult ? now : undefined,
      },
    });
    const tokens = await this.issueSession(user.id, user.email);
    const { passwordHash: _p, ...safe } = user;
    return { user: safe, ...tokens };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException();
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException();
    const tokens = await this.issueSession(user.id, user.email);
    const { passwordHash: _p, ...safe } = user;
    return { user: safe, ...tokens };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw new UnauthorizedException();
    const tokenHash = sha256Hex(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException();
    }
    await this.prisma.refreshSession.delete({ where: { id: session.id } });
    const tokens = await this.issueSession(session.userId, session.user.email);
    const { passwordHash: _p, ...safe } = session.user;
    return { user: safe, ...tokens };
  }

  async logout(refreshToken: string | undefined) {
    if (refreshToken) {
      const tokenHash = sha256Hex(refreshToken);
      await this.prisma.refreshSession.deleteMany({ where: { tokenHash } });
    }
    return { ok: true as const };
  }

  async forgotPassword(dto: RequestResetDto) {
    const email = dto.email.toLowerCase();
    const user = await this.users.findByEmail(email);
    if (user) {
      const plaintext = randomBytes(32).toString('hex');
      const tokenHash = sha256Hex(plaintext);
      const expiresAt = new Date(Date.now() + RESET_MS);
      await this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });
      if (process.env.NODE_ENV === 'development') {
        this.logger.log(
          `[DEV ONLY] Password reset link: http://localhost:8100/reset-password?token=${plaintext}`,
        );
      }
    }
    return {
      message: 'If an account exists, instructions were sent.',
    };
  }

  async resetPassword(dto: ConfirmResetDto) {
    const tokenHash = sha256Hex(dto.token);
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshSession.deleteMany({ where: { userId: row.userId } }),
    ]);
    return { ok: true as const };
  }
}
