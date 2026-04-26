import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import type { VerifyCallback } from 'passport-oauth2';
import { OAuthProfile } from './google.strategy';

type AppleProfile = {
  id: string;
  email?: string;
  name?: { firstName?: string; lastName?: string };
};

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('APPLE_CLIENT_ID') ?? 'disabled',
      teamID: config.get<string>('APPLE_TEAM_ID') ?? 'disabled',
      keyID: config.get<string>('APPLE_KEY_ID') ?? 'disabled',
      privateKeyString: config.get<string>('APPLE_KEY_CONTENTS') ?? 'disabled',
      callbackURL: config.get<string>('APPLE_CALLBACK_URL') ?? 'http://localhost:3000/auth/apple/callback',
      scope: ['name', 'email'],
      state: true,
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    idToken: string,
    profile: AppleProfile,
    done: VerifyCallback,
  ) {
    const nameParts = [profile?.name?.firstName, profile?.name?.lastName].filter(Boolean);
    const name = nameParts.length ? nameParts.join(' ') : undefined;
    const out: OAuthProfile = {
      provider: 'apple',
      providerUserId: profile.id,
      email: profile.email,
      name,
    };
    done(null, out);
  }
}

