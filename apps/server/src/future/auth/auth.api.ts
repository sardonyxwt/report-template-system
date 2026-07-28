import { Controller, Inject, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  AUTH_COOKIE_KEY,
  AUTH_REFRESH_COOKIE_KEY,
  CheckSessionRequest,
} from 'platform/common-base';
import {
  EndpointUser,
  SessionUser,
  Cookies,
  CookieService,
  Endpoint,
  EndpointBody,
} from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { AuthService } from './auth.service';

/**
 * HTTP boundary for authentication flows.
 *
 * The route shape, guards, request body parsing, and response validation are
 * defined by the shared `endpoints.auth` contracts through `@Endpoint`.
 * This controller keeps only transport-specific concerns: reading the current
 * Passport user, binding or clearing cookies, and delegating token lifecycle
 * work to `AuthService`.
 */
@Controller()
export class AuthApi {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
    @Inject(CookieService)
    private readonly cookieHelper: CookieService,
  ) {}

  /**
   * Starts the Google OAuth redirect flow.
   *
   * Passport handles the response before the method body is used, so the empty
   * implementation is intentional.
   */
  @Endpoint(endpoints.auth.oauthGoogle, {
    desc: 'Start Google OAuth authentication.',
  })
  async oauthGoogle() {}

  /**
   * Completes Google OAuth for clients that store returned bearer tokens.
   */
  @Endpoint(endpoints.auth.oauthGoogleLogin, {
    desc: 'Authenticate with Google OAuth and return access tokens.',
  })
  async oauthGoogleLogin(
    @EndpointUser()
    user: SessionUser,
  ) {
    return this.authService.oauthLogin(user.id);
  }

  /**
   * Completes Google OAuth for browser clients and writes signed session
   * cookies instead of returning the token pair in the response body.
   */
  @Endpoint(endpoints.auth.oauthGoogleCreateSession, {
    desc: 'Authenticate with Google OAuth and bind session cookies.',
  })
  async oauthGoogleCreateSession(
    @EndpointUser()
    user: SessionUser,
    @Res({ passthrough: true })
    res: Response,
  ) {
    const tokens = await this.authService.oauthLogin(user.id);
    this.cookieHelper.bindCookies(res, tokens);
  }

  /**
   * Rotates the access token using the refresh identity resolved by the refresh
   * guard. The refresh token itself is preserved until explicit logout or user
   * invalidation.
   */
  @Endpoint(endpoints.auth.refresh, {
    desc: 'Refresh authentication tokens with a refresh token.',
  })
  refresh(
    @EndpointUser()
    user: SessionUser,
  ) {
    return this.authService.refresh(user.refreshToken!);
  }

  /**
   * Refreshes only the browser access cookie. This is useful for cookie-based
   * sessions where the refresh token cookie already remains valid.
   */
  @Endpoint(endpoints.auth.refreshSession, {
    desc: 'Refresh the session access cookie.',
  })
  async refreshSession(
    @EndpointUser()
    user: SessionUser,
    @Res({ passthrough: true })
    res: Response,
  ) {
    const { accessToken } = await this.authService.refresh(user.refreshToken!);
    this.cookieHelper.bindAccessCookie(res, accessToken);
  }

  /**
   * Invalidates persisted user tokens and clears both session cookies.
   */
  @Endpoint(endpoints.auth.logout, {
    desc: 'Log out the current user and clear session cookies.',
  })
  async logout(
    @EndpointUser()
    user: SessionUser,
    @Res({ passthrough: true })
    res: Response,
  ) {
    await this.authService.logout(user.id);
    this.cookieHelper.unbindCookies(res);
  }

  /**
   * Returns the already validated session profile attached by the auth guard.
   */
  @Endpoint(endpoints.auth.profile, {
    desc: 'Return the authenticated user profile.',
  })
  profile(
    @EndpointUser()
    user: SessionUser,
  ) {
    return user;
  }

  /**
   * Checks token activity from either request body tokens or signed cookies.
   *
   * Inactive cookie credentials are cleared opportunistically so browser
   * clients do not keep retrying known-invalid tokens.
   */
  @Endpoint(endpoints.auth.check, {
    desc: 'Check whether access and refresh credentials are active.',
  })
  async check(
    @Res({ passthrough: true })
    res: Response,
    @EndpointBody()
    data?: CheckSessionRequest,
    @Cookies(AUTH_COOKIE_KEY)
    accessToken?: string,
    @Cookies(AUTH_REFRESH_COOKIE_KEY)
    refreshToken?: string,
  ) {
    const result = await this.authService.checkSession({
      accessToken: data?.accessToken ?? accessToken,
      refreshToken: data?.refreshToken ?? refreshToken,
    });

    if (!result.active && accessToken) {
      this.cookieHelper.unbindAccessCookie(res);
    }

    if (!result.refreshable && refreshToken) {
      this.cookieHelper.unbindRefreshCookie(res);
    }

    return result;
  }
}
