import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { AsyncLocalStorage } from 'async_hooks';
import {
  AbilityCheckResult,
  AbilityChecker,
  AbilityDeclineReason,
  IsWho,
  getUserAbilities,
  isWho,
  ProfileResponse,
  userResponseToJwtStrategyPayload,
} from 'platform/common-base';
import { userInclude, AuthProviderType, User } from 'platform/prisma';
import { PrismaService } from '../../prisma/prisma.service';

export type SessionUser = User & ProfileResponse;

export type OauthPayload = {
  provider: AuthProviderType;
  externalId: string;
  email: string;
  name: string;
  surname: string;
  picture?: string | null;
};

type AsyncStoreUserCurrent = {
  user?: SessionUser;
};

/**
 * Stores the current request user and centralizes authorization checks.
 *
 * The request user is kept in `AsyncLocalStorage`, so services can call
 * `session.user` or `session.abilityGuard(...)` without threading the user
 * through every method signature. Every request must enter through `init` via
 * `SessionMiddleware`; background jobs should use `withUser` when they need a
 * scoped identity.
 */
@Injectable()
export class SessionService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  private storage = new AsyncLocalStorage<AsyncStoreUserCurrent>();

  /**
   * Creates an empty async session scope for a request or scoped operation.
   */
  init<T>(cb: () => T | Promise<T>): Promise<T> {
    return this.storage.run({}, async () => cb());
  }

  /**
   * Assigns the current user for the active async scope.
   */
  set user(user: SessionUser | undefined) {
    const asyncStore = this.storage.getStore();
    if (asyncStore && user) {
      asyncStore.user = user;
    }
  }

  /**
   * Returns the current user enriched with role helper flags.
   */
  get user(): (IsWho & SessionUser) | undefined {
    const user = this.storage.getStore()?.user;
    if (user) {
      return { ...user, ...isWho(user?.role) };
    }
    return;
  }

  /**
   * Returns the current user or throws when the request is anonymous.
   */
  get authorizedUser(): IsWho & SessionUser {
    const user = this.user;
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  /**
   * Runs a callback in a new async scope preloaded with a known user.
   */
  async withUser<T>(user: SessionUser, init: () => Promise<T>) {
    return this.init(() => {
      this.user = user;
      return init();
    });
  }

  /**
   * Checks whether an email already belongs to a user, case-insensitively.
   */
  async exist(username: string): Promise<boolean> {
    const count = await this.prisma.tx.user.count({
      where: {
        email: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });

    return count > 0;
  }

  /**
   * Authorizes an active user from OAuth profile data.
   *
   * If the email exists without the provider link, the provider is attached.
   * If the provider exists with a different external id, authorization fails.
   */
  async authorizeByOauthPayload(
    payload: OauthPayload,
  ): Promise<ProfileResponse> {
    const user = await this.prisma.tx.user.findFirst({
      where: {
        email: {
          equals: payload.email,
          mode: 'insensitive',
        },
      },
      include: {
        ...userInclude.includeProfile,
        authProviders: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const authProvider = user.authProviders.find(
      (it) => it.provider === payload.provider,
    );

    if (authProvider && authProvider.externalId !== payload.externalId) {
      throw new UnauthorizedException();
    }

    if (!authProvider) {
      await this.prisma.tx.authProvider.create({
        data: {
          externalId: payload.externalId,
          userId: user.id,
          provider: payload.provider,
        },
      });
    }

    this.user = user;

    return user;
  }

  /**
   * Authorizes a user only when the presented access token matches the active
   * database token for that user.
   */
  async authorizeByIdAndAccessToken(
    id: number,
    accessToken: string,
  ): Promise<ProfileResponse> {
    const user = await this.prisma.tx.user.findFirst({
      where: {
        id,
        accessToken,
      },
      include: userInclude.includeProfile,
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    user.accessToken = accessToken;

    this.user = user;

    return user;
  }

  /**
   * Authorizes a user only when the presented refresh token matches the active
   * database token for that user.
   */
  async authorizeByIdAndRefreshToken(
    id: number,
    refreshToken: string,
  ): Promise<ProfileResponse> {
    const user = await this.prisma.tx.user.findFirst({
      where: {
        id,
        refreshToken,
      },
      include: userInclude.includeProfile,
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    user.refreshToken = refreshToken;

    this.user = user;

    return user;
  }

  /**
   * Executes a typed ability check and converts decline reasons into HTTP
   * exceptions that match the failure class.
   */
  abilityGuard<
    K extends keyof SessionService['abilities'],
    A extends keyof SessionService['abilities'][K],
  >(
    entity: K,
    action: A,
    ...args: SessionService['abilities'][K][A] extends AbilityChecker
      ? Parameters<SessionService['abilities'][K][A]>
      : []
  ) {
    const actionChecker = this.abilities[entity][action] as (
      ...arg: typeof args
    ) => AbilityCheckResult;
    const checkResult = actionChecker(...args);

    if (checkResult.granted) {
      return;
    }

    switch (checkResult.declineReason) {
      case AbilityDeclineReason.UserRoleInsufficient:
      case AbilityDeclineReason.ChangedProtectedFields:
      case AbilityDeclineReason.EntityHasDependencies:
      case AbilityDeclineReason.EntityNotAvailable:
      case AbilityDeclineReason.NotOwned:
      case AbilityDeclineReason.EntityUsed:
        throw new ForbiddenException(checkResult);
      case AbilityDeclineReason.UserNotAuthorized:
        throw new UnauthorizedException(checkResult);
      case AbilityDeclineReason.EntityIncorrect:
        throw new BadRequestException(checkResult);
    }
  }

  /**
   * Builds the ability map for the current request user.
   */
  get abilities() {
    return getUserAbilities(userResponseToJwtStrategyPayload(this.user));
  }
}
