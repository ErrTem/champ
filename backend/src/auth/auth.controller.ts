import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService, ACCESS_COOKIE, REFRESH_COOKIE } from './auth.service';
import { ConfirmResetDto } from './dto/confirm-reset.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import type { OAuthProfile } from './strategies/google.strategy';

const ACCESS_MAX_AGE_MS = 900 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieBase() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
  };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const base = cookieBase();
  res.cookie(ACCESS_COOKIE, accessToken, { ...base, maxAge: ACCESS_MAX_AGE_MS });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...base, maxAge: REFRESH_MAX_AGE_MS });
}

function clearAuthCookies(res: Response) {
  const base = cookieBase();
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}

function safeReturnTo(value: unknown, fallback: string): string {
  const v = typeof value === 'string' ? value : '';
  if (!v) return fallback;
  if (!v.startsWith('/')) return fallback;
  if (v.startsWith('//')) return fallback;
  return v;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.auth.register(dto);
    setAuthCookies(res, accessToken, refreshToken);
    return { ok: true, user };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.auth.login(dto);
    setAuthCookies(res, accessToken, refreshToken);
    return { ok: true, user };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const { user, accessToken, refreshToken: nextRefresh } = await this.auth.refresh(
      refreshToken,
    );
    setAuthCookies(res, accessToken, nextRefresh);
    return { ok: true, user };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.auth.logout(refreshToken);
    clearAuthCookies(res);
    return { ok: true };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: RequestResetDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ConfirmResetDto) {
    return this.auth.resetPassword(dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleStart() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user?: OAuthProfile },
    @Res() res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.auth.oauthLogin(req.user as OAuthProfile);
    setAuthCookies(res, accessToken, refreshToken);
    const fallback = process.env.OAUTH_REDIRECT_SUCCESS || '/profile';
    const returnTo = safeReturnTo((req.query as any)?.returnTo, fallback);
    return res.redirect(returnTo);
  }

  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  async appleStart() {
    return;
  }

  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleCallback(
    @Req() req: Request & { user?: OAuthProfile },
    @Res() res: Response,
  ) {
    const { accessToken, refreshToken } = await this.auth.oauthLogin(req.user as OAuthProfile);
    setAuthCookies(res, accessToken, refreshToken);
    const fallback = process.env.OAUTH_REDIRECT_SUCCESS || '/profile';
    const returnTo = safeReturnTo((req.query as any)?.returnTo, fallback);
    return res.redirect(returnTo);
  }
}
