import { User, UserRole } from 'platform/prisma';
import { JwtStrategyPayload } from './data/auth/auth.types';
import {
  AbilityChecker,
  AbilityDeclineReason,
  createUserAbilitiesHelper,
} from './utils/abilities.utils';
import { isWho } from './utils/auth.utils';

export interface OwnedEntityCheck {
  managerId: number;
}

export type UserUpdateGuardedFields = Pick<User, 'id' | 'role' | 'email'>;
export type UserUpdateFields = Pick<User, 'id' | 'email'>;

export type UserReadCheck = {
  userId?: number | null;
};

export type UserUpdateCheck = {
  user: UserUpdateGuardedFields;
  updates?: UserUpdateFields;
};

export type UserDeleteCheck = {
  role: UserRole;
};

export type PatientCreateCheck = OwnedEntityCheck & {
  userRole: UserRole;
  isAssigned: boolean;
};

export type ClinicUpdateCheck = {
  clinic: OwnedEntityCheck;
  updates: OwnedEntityCheck;
};

export type PatientReportCreateCheck = {
  reportManagerId: number;
  reportClinicId: number;
  templateManagerId: number;
  templateClinicId: number;
};

export type PatientReportReadCheck = {
  patientId: number;
  managerId: number;
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
        isAdmin
          ? helper.forAdmin()
          : helper.forUserOwner({ ownerId: args.userId }),
      create: () => helper.forAdmin(),
      update: ({ user, updates }: UserUpdateCheck) => {
        const authorizedCheck = helper.forAuthorized();
        if (!authorizedCheck.granted) return authorizedCheck;

        const isMe = user.id === payload?.id;

        const notChangedGuardedFields =
          !updates || user.email === updates.email;

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
      delete: () => helper.forAdmin(),
    },
    clinics: {
      create: ({ managerId }: OwnedEntityCheck) =>
        isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId }),
      read: ({ managerId }: OwnedEntityCheck) =>
        isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId }),
      update: ({ clinic, updates }: ClinicUpdateCheck) => {
        const ownerCheck = isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: clinic.managerId });

        if (!ownerCheck.granted) {
          return ownerCheck;
        }

        if (!isAdmin && clinic.managerId !== updates.managerId) {
          return helper.decline(AbilityDeclineReason.ChangedProtectedFields);
        }

        return helper.grant;
      },
      delete: ({ managerId }: OwnedEntityCheck) => {
        return isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId });
      },
    },
    patients: {
      create: ({ managerId, userRole, isAssigned }: PatientCreateCheck) => {
        const ownerCheck = isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId });

        if (!ownerCheck.granted) {
          return ownerCheck;
        }

        if (userRole !== UserRole.User || isAssigned) {
          return helper.decline(AbilityDeclineReason.EntityIncorrect);
        }

        return helper.grant;
      },
      read: ({ managerId }: OwnedEntityCheck) =>
        isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId }),
      delete: ({ managerId }: OwnedEntityCheck) =>
        isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId }),
    },
    templates: {
      preview: () =>
        helper.forSomeone({ roles: [UserRole.Admin, UserRole.Manager] }),
      aiEdit: () =>
        helper.forSomeone({ roles: [UserRole.Admin, UserRole.Manager] }),
      create: ({ managerId }: OwnedEntityCheck) =>
        isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId }),
      read: ({ managerId }: OwnedEntityCheck) =>
        isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId }),
      update: ({ managerId }: OwnedEntityCheck) =>
        isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId }),
      delete: ({ managerId }: OwnedEntityCheck) =>
        isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId }),
    },
    clinicReports: {
      create: ({ managerId }: OwnedEntityCheck) =>
        isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId }),
      read: ({ managerId }: OwnedEntityCheck) =>
        isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId }),
      delete: ({ managerId }: OwnedEntityCheck) =>
        isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId }),
    },
    patientReports: {
      create: ({
        reportManagerId,
        reportClinicId,
        templateManagerId,
        templateClinicId,
      }: PatientReportCreateCheck) => {
        if (
          reportClinicId !== templateClinicId ||
          reportManagerId !== templateManagerId
        ) {
          return helper.decline(AbilityDeclineReason.EntityIncorrect);
        }

        return isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: reportManagerId });
      },
      read: ({ managerId, patientId }: PatientReportReadCheck) => {
        if (isAdmin || isManager) {
          return isAdmin
            ? helper.forAdmin()
            : helper.forManagerOwner({ ownerId: managerId });
        }

        return helper.forUserOwner({ ownerId: patientId });
      },
      delete: ({ managerId }: OwnedEntityCheck) =>
        isAdmin
          ? helper.forAdmin()
          : helper.forManagerOwner({ ownerId: managerId }),
    },
  } satisfies Record<string, Record<string, AbilityChecker>>;
};

export type UserAbilities = ReturnType<typeof getUserAbilities>;
