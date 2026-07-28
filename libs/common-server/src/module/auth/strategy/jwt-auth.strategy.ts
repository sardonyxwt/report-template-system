import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import {
  AUTH_COOKIE_KEY,
  JwtStrategyPayload,
  ProfileResponse,
} from 'platform/common-base';
import { AUTH_MODULE_OPTIONS, AuthModuleOptions } from '../auth.options';
import { SessionService } from '../service/session.service';
import { SigningRequest, createAuthExtractor } from './jwt.strategy';

/**
 * Access-token strategy for protected endpoints.
 *
 * JWTs are verified by Passport and then matched against the active database
 * token for the resolved user through `SessionService`.
 */
@Injectable()
export class JwtAuthStrategy extends PassportStrategy(
  Strategy,
  AUTH_COOKIE_KEY,
) {
  private readonly jwtExtractor: ReturnType<typeof createAuthExtractor>;

  constructor(
    @Inject(SessionService)
    private readonly session: SessionService,
    @Inject(AUTH_MODULE_OPTIONS)
    options: AuthModuleOptions,
  ) {
    const jwtExtractor = createAuthExtractor(
      AUTH_COOKIE_KEY,
      options.cookieSecret,
    );

    super({
      jwtFromRequest: jwtExtractor,
      secretOrKey: options.jwtSecret,
      ignoreExpiration: false,
      passReqToCallback: true,
    });

    this.jwtExtractor = jwtExtractor;
  }

  /**
   * Validates that the JWT payload and presented token still match an active
   * database session.
   */
  async validate(
    req: SigningRequest,
    payload: JwtStrategyPayload,
  ): Promise<ProfileResponse> {
    const token = this.jwtExtractor(req);

    if (!token) {
      throw new ForbiddenException();
    }

    const user = await this.session.authorizeByIdAndAccessToken(
      payload.id,
      token,
    );

    return (req.user = req.auth = user);
  }
}
