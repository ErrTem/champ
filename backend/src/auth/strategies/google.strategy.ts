import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import type { VerifyCallback } from 'passport-oauth2';

export type OAuthProfile = {
  provider: 'google' | 'apple';
  providerUserId: string;
  email?: string;
  name?: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') ?? 'disabled',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') ?? 'disabled',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') ?? 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
      state: true,
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || undefined;
    const out: OAuthProfile = {
      provider: 'google',
      providerUserId: profile.id,
      email,
      name,
    };
    done(null, out);
  }
}

