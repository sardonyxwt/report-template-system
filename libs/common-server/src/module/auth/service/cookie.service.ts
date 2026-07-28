import { Inject, Injectable } from '@nestjs/common';
import { Response, CookieOptions } from 'express';
import {
  AUTH_COOKIE_KEY,
  AUTH_REFRESH_COOKIE_KEY,
  SECOND,
} from 'platform/common-base';
import { AUTH_MODULE_OPTIONS, AuthModuleOptions } from '../auth.options';
import { TokensService } from './tokens.service';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Writes and clears signed HTTP-only authentication cookies.
 *
 * Cookie max-age is derived from JWT `exp`, keeping browser cookie lifetime in
 * sync with token lifetime. The service does not issue tokens itself; callers
 * pass tokens produced by `TokensService`/`AuthService`.
 */
@Injectable()
export class CookieService {
  constructor(
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly options: AuthModuleOptions,
    @Inject(TokensService)
    private readonly tokensService: TokensService,
  ) {}

  /**
   * Returns shared browser-visible cookie options.
   */
  get commonOptions(): CookieOptions {
    return {
      sameSite: 'lax',
      secure: this.options.cookieSecure,
      domain: this.options.cookieDomain,
    };
  }

  /**
   * Returns signed, HTTP-only options for credential cookies.
   */
  get commonSecureOptions(): CookieOptions {
    return {
      signed: true,
      httpOnly: true,
      ...this.commonOptions,
    };
  }

  /**
   * Writes access and refresh cookies for a full browser session.
   */
  bindCookies(res: Response, tokens: Tokens) {
    this.bindAccessCookie(res, tokens.accessToken);
    this.bindRefreshCookie(res, tokens.refreshToken);
  }

  /**
   * Writes the access-token cookie with max-age matched to JWT expiration.
   */
  bindAccessCookie(res: Response, accessToken: string) {
    res.cookie(AUTH_COOKIE_KEY, accessToken, {
      ...this.commonSecureOptions,
      maxAge: this.getTokenCookieMaxAge(accessToken),
    });
  }

  /**
   * Writes the refresh-token cookie with max-age matched to JWT expiration.
   */
  bindRefreshCookie(res: Response, refreshToken: string) {
    res.cookie(AUTH_REFRESH_COOKIE_KEY, refreshToken, {
      ...this.commonSecureOptions,
      maxAge: this.getTokenCookieMaxAge(refreshToken),
    });
  }

  /**
   * Clears the access-token cookie using the same cookie options.
   */
  unbindAccessCookie(res: Response) {
    res.clearCookie(AUTH_COOKIE_KEY, this.commonSecureOptions);
  }

  /**
   * Clears the refresh-token cookie using the same cookie options.
   */
  unbindRefreshCookie(res: Response) {
    res.clearCookie(AUTH_REFRESH_COOKIE_KEY, this.commonSecureOptions);
  }

  /**
   * Clears both authentication cookies.
   */
  unbindCookies(res: Response) {
    this.unbindAccessCookie(res);
    this.unbindRefreshCookie(res);
  }

  private getTokenCookieMaxAge(token: string): number {
    const tokenInfo = this.tokensService.readAccessToken(token);

    if (!tokenInfo?.exp) {
      return 0;
    }

    return Math.max(tokenInfo.exp * SECOND - Date.now(), 0);
  }
}
