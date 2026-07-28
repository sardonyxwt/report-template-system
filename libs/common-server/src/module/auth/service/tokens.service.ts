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

export type JwtStrategyPayloadWithInfo = JwtStrategyPayload &
  Required<Pick<JwtPayload, 'iat' | 'exp'>>;

/**
 * Creates and decodes JWT tokens used by auth guards and session endpoints.
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
  readAccessToken(token: string): JwtStrategyPayloadWithInfo | undefined {
    return token ? this.jwtService.decode(token, { json: true }) : undefined;
  }
}
