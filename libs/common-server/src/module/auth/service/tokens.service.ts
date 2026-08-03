import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import {
  JwtStrategyPayload,
  JwtStrategyPayloadCreationData,
  JwtStrategyPayloadSchema,
  userResponseToJwtStrategyPayload,
} from 'platform/common-base';
import { AUTH_MODULE_OPTIONS, AuthModuleOptions } from '../auth.options';

/**
 * Verified JWT payload with required issued-at and expiration claims.
 */
export type JwtStrategyPayloadWithInfo = JwtStrategyPayload &
  Required<Pick<JwtPayload, 'iat' | 'exp'>>;

/**
 * Creates and verifies JWT tokens used by auth guards and session endpoints.
 *
 * Token payloads are normalized through the shared schema before signing, so
 * access and refresh tokens carry the same stable authorization shape.
 */
@Injectable()
export class TokensService {
  constructor(
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly options: AuthModuleOptions,
  ) {}

  /**
   * Signs a refresh token with the refresh secret and refresh TTL.
   */
  createRefreshToken(user: JwtStrategyPayloadCreationData): string {
    return this.jwtService.sign<JwtStrategyPayload>(
      JwtStrategyPayloadSchema.parse(userResponseToJwtStrategyPayload(user)),
      {
        secret: this.options.jwtRefreshSecret,
        expiresIn: this.options.jwtRefreshSecretExpires,
      },
    );
  }

  /**
   * Signs an access token with the access secret and access TTL.
   */
  createAccessToken(user: JwtStrategyPayloadCreationData): string {
    return this.jwtService.sign<JwtStrategyPayload>(
      JwtStrategyPayloadSchema.parse(userResponseToJwtStrategyPayload(user)),
      {
        secret: this.options.jwtSecret,
        expiresIn: this.options.jwtSecretExpires,
      },
    );
  }

  /**
   * Decodes token payload and timing claims without verifying persistence.
   *
   * Use auth strategies or `AuthService.checkSession` when active database
   * token matching is required.
   */
  readToken(token: string): JwtStrategyPayloadWithInfo | undefined {
    return token ? this.jwtService.decode(token, { json: true }) : undefined;
  }

  /**
   * Verifies an access token signature and returns its payload when valid.
   */
  verifyAccessToken(token: string): JwtStrategyPayloadWithInfo | undefined {
    if (!token) {
      return;
    }

    try {
      return this.jwtService.verify<JwtStrategyPayloadWithInfo>(token, {
        secret: this.options.jwtSecret,
      });
    } catch {
      return;
    }
  }

  /**
   * Verifies a refresh token signature and returns its payload when valid.
   */
  verifyRefreshToken(token: string): JwtStrategyPayloadWithInfo | undefined {
    if (!token) {
      return;
    }

    try {
      return this.jwtService.verify<JwtStrategyPayloadWithInfo>(token, {
        secret: this.options.jwtRefreshSecret,
      });
    } catch {
      return;
    }
  }
}
