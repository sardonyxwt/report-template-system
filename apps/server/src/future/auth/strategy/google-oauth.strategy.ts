import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { google } from 'googleapis';
import { Strategy, VerifyCallback } from 'passport-oauth2';
import { OAUTH_GOOGLE_KEY } from 'platform/common-base';
import { OauthPayload, SessionService } from 'platform/common-server';
import { AuthProviderType } from 'platform/prisma';
import { AuthService } from '../auth.service';

/**
 * Google OAuth2 strategy used by the auth endpoints.
 *
 * It fetches the Google profile with the provider access token, normalizes it
 * into the shared OAuth payload, creates a local user on first login, and then
 * authorizes the resulting local profile through `SessionService`.
 */
@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(
  Strategy,
  OAUTH_GOOGLE_KEY,
) {
  private readonly clientID: string;
  private readonly clientSecret: string;

  constructor(
    @Inject(SessionService)
    private readonly session: SessionService,
    @Inject(AuthService)
    private readonly authService: AuthService,
    @Inject(ConfigService)
    config: ConfigService,
  ) {
    const clientID = config.getOrThrow('GOOGLE_CLIENT_ID');
    const clientSecret = config.getOrThrow('GOOGLE_CLIENT_SECRET');
    const callbackURL = config.getOrThrow('GOOGLE_REDIRECT_URL');

    super({
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
      clientID,
      clientSecret,
      callbackURL,
      scope: ['profile', 'email'],
    });

    this.clientID = clientID;
    this.clientSecret = clientSecret;
  }

  /**
   * Fetches and normalizes Google userinfo after OAuth token exchange.
   */
  override async userProfile(
    accessToken: string,
    done: (err: Error | null, profile: OauthPayload) => void,
  ) {
    const client = new google.auth.OAuth2(this.clientID, this.clientSecret);

    client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({
      auth: client,
      version: 'v2',
    });

    const { data: user } = await oauth2.userinfo.get();

    if (!user.id || !user.email || !user.given_name || !user.family_name) {
      throw new UnauthorizedException();
    }

    const payload: OauthPayload = {
      provider: AuthProviderType.Google,
      externalId: user.id,
      email: user.email,
      name: user.given_name,
      surname: user.family_name,
      picture: user.picture,
    };

    done(null, payload);
  }

  /**
   * Ensures a local account exists and attaches the authorized profile to the
   * Passport request flow.
   */
  async validate(
    _accessToken: string,
    _refreshToken: string,
    payload: OauthPayload,
    done: VerifyCallback,
  ): Promise<void> {
    const exist = await this.session.exist(payload.email);

    if (!exist) {
      await this.authService.oauthSignup(payload);
    }

    const oauthUser = await this.session.authorizeByOauthPayload(payload);

    done(null, oauthUser);
  }
}
