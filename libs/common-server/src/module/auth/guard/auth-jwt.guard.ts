import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport/dist/auth.guard';
import { AUTH_COOKIE_KEY } from 'platform/common-base';

/**
 * Requires a valid access credential resolved by `JwtAuthStrategy`.
 */
@Injectable()
export class JwtAuthGuard extends PassportAuthGuard(AUTH_COOKIE_KEY) {}
