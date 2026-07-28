import { User, UserRole } from 'platform/prisma';
import { JwtStrategyPayload } from './data/auth/auth.types';
import {
  AbilityChecker,
  AbilityDeclineReason,
  createUserAbilitiesHelper,
} from './utils/abilities.utils';
import { isWho } from './utils/auth.utils';

export type UserUpdateGuardedFields = Pick<User, 'id' | 'role' | 'email'>;

export type UserReadCheck = {
  userId?: number | null;
};

export type UserUpdateCheck = {
  user: UserUpdateGuardedFields;
  updates?: UserUpdateGuardedFields;
};

export type UserDeleteCheck = {
  role: UserRole;
};

/**
 * Builds the authorization matrix for a JWT/session payload.
 *
 * The returned functions are intentionally pure and serializable-friendly:
 * services pass entity facts into the checker and receive a grant/decline
 * result that server code later maps to HTTP exceptions.
 */
export const getUserAbilities = (payload?: JwtStrategyPayload) => {
  const { isAdmin, isManager } = isWho(payload?.role);

  const helper = createUserAbilitiesHelper(payload);

  return {
    users: {
      read: (args: UserReadCheck) =>
        isAdmin || isManager
          ? helper.forAdmin()
          : helper.forUserOwner({
              ownerId: args.userId,
            }),
      create: () => helper.forAdmin(),
      update: ({ user, updates = user }: UserUpdateCheck) => {
        const authorizedCheck = helper.forAuthorized();
        if (!authorizedCheck.granted) return authorizedCheck;

        const isMe = user.id === payload?.id;

        const notChangedGuardedFields =
          user.role === updates.role && user.email === updates.email;

        if (isMe) {
          if (notChangedGuardedFields) return helper.grant;
          return helper.decline(AbilityDeclineReason.ChangedProtectedFields);
        }

        const userIs = isWho(user.role);

        if (isAdmin && !userIs.isAdmin) {
          return helper.forAdmin();
        }

        return helper.decline(AbilityDeclineReason.UserRoleInsufficient);
      },
      delete: ({ role }: UserDeleteCheck) => {
        if (role !== UserRole.User) {
          return helper.decline(AbilityDeclineReason.UserRoleInsufficient);
        }

        return helper.forAdmin();
      },
    },
    managers: {
      create: helper.forAdmin,
      delete: helper.forAdmin,
    },
  } satisfies Record<string, Record<string, AbilityChecker>>;
};

export type UserAbilities = ReturnType<typeof getUserAbilities>;
