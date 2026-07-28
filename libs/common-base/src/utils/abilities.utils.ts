import { UserRole } from 'platform/prisma';
import { JwtStrategyPayload } from '../data/auth/auth.types';
import { isWho } from './auth.utils';

export type OwnerActionCheck = {
  ownerId?: number | number[] | null;
};

export type RoleActionCheck = {
  roles?: UserRole[];
};

export enum AbilityDeclineReason {
  UserNotAuthorized = 'UserNotAuthorized',
  UserRoleInsufficient = 'UserRoleInsufficient',
  ChangedProtectedFields = 'ChangedProtectedFields',
  EntityHasDependencies = 'EntityHasDependencies',
  EntityNotAvailable = 'EntityNotAvailable',
  EntityIncorrect = 'EntityIncorrect',
  EntityUsed = 'EntityUsed',
  NotOwned = 'NotOwned',
}

export type AbilityCheckResult = {
  granted: boolean;
  declineReason?: AbilityDeclineReason;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AbilityChecker = (...args: any) => AbilityCheckResult;

/**
 * Creates reusable ability predicates for a user payload.
 *
 * Helpers return structured decline reasons instead of throwing. This keeps
 * shared authorization logic framework-agnostic while allowing Nest services to
 * translate failures into the correct HTTP exceptions.
 */
export const createUserAbilitiesHelper = (payload?: JwtStrategyPayload) => {
  const { isGuest } = isWho(payload?.role);

  const grant: AbilityCheckResult = { granted: true };

  const decline = (
    declineReason: AbilityDeclineReason,
  ): AbilityCheckResult => ({
    granted: false,
    declineReason,
  });

  const forAll = () => grant;

  const forSomeone = ({
    roles = Object.values(UserRole),
  }: RoleActionCheck = {}) => {
    if (isGuest) {
      return decline(AbilityDeclineReason.UserNotAuthorized);
    }

    if (!payload || !roles.includes(payload.role)) {
      return decline(AbilityDeclineReason.UserRoleInsufficient);
    }

    return grant;
  };

  const forOwner = ({
    roles = Object.values(UserRole),
    ownerId,
  }: RoleActionCheck & OwnerActionCheck) => {
    const roleCheckResult = forSomeone({ roles });

    if (!roleCheckResult.granted) {
      return roleCheckResult;
    }

    if (
      !ownerId ||
      !payload ||
      (Array.isArray(ownerId)
        ? ownerId.every((id) => id !== payload.id)
        : payload.id !== ownerId)
    ) {
      return decline(AbilityDeclineReason.NotOwned);
    }

    return grant;
  };

  const forAuthorized = () => forSomeone();

  const forAdmin = () => forSomeone({ roles: [UserRole.Admin] });

  const forManager = () => forSomeone({ roles: [UserRole.Manager] });

  const forUserOwner = (args: OwnerActionCheck) =>
    forOwner({ roles: [UserRole.User], ...args });

  return {
    grant,
    decline,
    forAll,
    forAdmin,
    forSomeone,
    forManager,
    forAuthorized,
    forOwner,
    forUserOwner,
  };
};
