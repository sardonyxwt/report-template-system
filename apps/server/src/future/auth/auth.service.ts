import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CheckSessionRequest,
  CheckSessionResponse,
  TokensResponse,
} from 'platform/common-base';
import {
  JwtStrategyPayloadWithInfo,
  OauthPayload,
  PrismaService,
  TokensService,
} from 'platform/common-server';
import { UserRole } from 'platform/prisma';

/**
 * Owns authentication state transitions for OAuth, JWT sessions, and refresh.
 *
 * The service persists active access/refresh tokens on the user record, which
 * allows logout and role changes to invalidate existing credentials.
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TokensService)
    private readonly tokensService: TokensService,
  ) {}

  /**
   * Issues a fresh access/refresh pair for an already authenticated OAuth user.
   */
  async oauthLogin(id: number) {
    this.logger.log('OAuth login requested', AuthService.name, {
      userId: id,
    });

    return this.authorize(id);
  }

  /**
   * Creates a local user from a trusted OAuth profile.
   *
   * The first created user becomes an administrator; subsequent OAuth signups
   * receive the default user role. Provider identity is stored immediately, so
   * later logins can reject mismatched external IDs for the same email.
   */
  async oauthSignup({
    email,
    provider,
    externalId,
    name,
    surname,
  }: OauthPayload) {
    this.logger.log('OAuth signup requested', AuthService.name, {
      provider,
    });

    const isFirstUser = (await this.prisma.tx.user.count()) === 0;

    const user = await this.prisma.run(async (tx) => {
      return tx.user.create({
        data: {
          role: isFirstUser ? UserRole.Admin : UserRole.User,
          email,
          fullName: `${name} ${surname}`,
          authProviders: {
            create: {
              externalId,
              provider,
            },
          },
        },
      });
    });

    this.logger.log('OAuth signup user created', AuthService.name, {
      userId: user.id,
      role: user.role,
      provider,
    });

    return user;
  }

  /**
   * Clears persisted access and refresh tokens for a user.
   */
  public async logout(id: number) {
    this.logger.log('Logout requested', AuthService.name);

    await this.prisma.tx.user.update({
      data: {
        accessToken: null,
        refreshToken: null,
      },
      where: { id },
    });

    this.logger.log('User logged out', AuthService.name);
  }

  /**
   * Validates a stored refresh token and returns a new access token.
   *
   * The refresh token must still match the active database value, so old tokens
   * stop working after logout or token invalidation.
   */
  async refresh(refreshToken: string): Promise<TokensResponse> {
    this.logger.log('Refresh token requested', AuthService.name);

    const user = await this.prisma.tx.user.findFirst({
      where: {
        refreshToken,
      },
      include: { manager: true },
    });

    if (!user) {
      this.logger.warn('Refresh token rejected', AuthService.name);

      throw new UnauthorizedException();
    }

    const accessToken = this.tokensService.createAccessToken(user);

    await this.prisma.tx.user.update({
      data: {
        accessToken,
      },
      where: { id: user.id },
    });

    this.logger.log('Refresh token completed', AuthService.name);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Reports whether provided access and refresh credentials are still usable.
   *
   * JWT timestamps come from verified tokens; activity is decided by both
   * token validity and a matching active user record in the database.
   */
  async checkSession({
    accessToken,
    refreshToken,
  }: CheckSessionRequest = {}): Promise<CheckSessionResponse> {
    if (!accessToken && !refreshToken) {
      return {
        active: false,
        refreshable: false,
        accessCreatedAt: 0,
        accessExpiresAt: 0,
        refreshCreatedAt: 0,
        refreshExpiresAt: 0,
      };
    }

    let accessTokenInfo: JwtStrategyPayloadWithInfo | undefined = undefined;
    let refreshTokenInfo: JwtStrategyPayloadWithInfo | undefined = undefined;
    let accessTokenActive = false;
    let refreshTokenActive = false;

    if (accessToken) {
      accessTokenInfo = this.tokensService.verifyAccessToken(accessToken);
      if (accessTokenInfo) {
        accessTokenActive = !!(await this.prisma.tx.user.findFirst({
          where: { id: accessTokenInfo.id, accessToken },
          select: { id: true },
        }));
      }
    }

    if (refreshToken) {
      refreshTokenInfo = this.tokensService.verifyRefreshToken(refreshToken);
      if (refreshTokenInfo) {
        refreshTokenActive = !!(await this.prisma.tx.user.findFirst({
          where: { id: refreshTokenInfo.id, refreshToken },
          select: { id: true },
        }));
      }
    }

    return {
      active: accessTokenActive,
      refreshable: refreshTokenActive,
      accessCreatedAt: (accessTokenInfo?.iat ?? 0) * 1000,
      accessExpiresAt: (accessTokenInfo?.exp ?? 0) * 1000,
      refreshCreatedAt: (refreshTokenInfo?.iat ?? 0) * 1000,
      refreshExpiresAt: (refreshTokenInfo?.exp ?? 0) * 1000,
    };
  }

  private async authorize(userId: number) {
    this.logger.log('Authorize user started', AuthService.name, {
      userId,
    });

    const user = await this.prisma.tx.user.findFirst({
      where: { id: userId },
      include: { manager: true },
    });

    if (!user) {
      this.logger.warn('Authorize user rejected', AuthService.name);

      throw new UnauthorizedException();
    }

    const tokens: TokensResponse = {
      accessToken: this.tokensService.createAccessToken(user),
      refreshToken: this.tokensService.createRefreshToken(user),
    };

    await this.prisma.tx.user.update({
      data: {
        ...tokens,
      },
      where: { id: user.id },
    });

    this.logger.log('Authorize user completed', AuthService.name, {
      userId: user.id,
      role: user.role,
    });

    return tokens;
  }
}
