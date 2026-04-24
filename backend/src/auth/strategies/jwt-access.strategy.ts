import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

type AccessPayload = { sub: string; email?: string };

/**
 * JWT is read from Authorization: Bearer <token> OR httpOnly cookie `access_token`
 * (must match Ionic `AuthService` / backend cookie names).
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          const v = req?.cookies?.access_token;
          return typeof v === 'string' ? v : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: AccessPayload) {
    return { sub: payload.sub, email: payload.email };
  }
}
