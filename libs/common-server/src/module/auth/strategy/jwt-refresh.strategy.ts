import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import {
  AUTH_REFRESH_COOKIE_KEY,
  JwtStrategyPayload,
  ProfileResponse,
} from 'platform/common-base';
import { AUTH_MODULE_OPTIONS, AuthModuleOptions } from '../auth.options';
import { SessionService } from '../service/session.service';
import { SigningRequest, createAuthExtractor } from './jwt.strategy';

/**
 * Refresh-token strategy for endpoints that rotate or inspect refresh sessions.
 *
 * The token must verify cryptographically and still match the active persisted
 * refresh token for the user.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  AUTH_REFRESH_COOKIE_KEY,
) {
  private readonly jwtExtractor: ReturnType<typeof createAuthExtractor>;

  constructor(
    @Inject(SessionService)
    private readonly session: SessionService,
    @Inject(AUTH_MODULE_OPTIONS)
    options: AuthModuleOptions,
  ) {
    const jwtExtractor = createAuthExtractor(
      AUTH_REFRESH_COOKIE_KEY,
      options.cookieSecret,
    );

    super({
      jwtFromRequest: jwtExtractor,
      secretOrKey: options.jwtRefreshSecret,
      ignoreExpiration: false,
      passReqToCallback: true,
    });

    this.jwtExtractor = jwtExtractor;
  }

  /**
   * Resolves the refresh identity and attaches the profile to the request.
   */
  async validate(
    req: SigningRequest,
    payload: JwtStrategyPayload,
  ): Promise<ProfileResponse> {
    const token = this.jwtExtractor(req);

    if (!token) {
      throw new ForbiddenException();
    }

    const user = await this.session.authorizeByIdAndRefreshToken(
      payload.id,
      token,
    );

    return (req.user = req.auth = user);
  }
}
