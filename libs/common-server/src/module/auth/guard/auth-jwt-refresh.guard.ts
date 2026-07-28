import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport/dist/auth.guard';
import { AUTH_REFRESH_COOKIE_KEY } from 'platform/common-base';

/**
 * Requires a valid refresh credential resolved by `JwtRefreshStrategy`.
 */
@Injectable()
export class JwtRefreshAuthGuard extends PassportAuthGuard(
  AUTH_REFRESH_COOKIE_KEY,
) {}
