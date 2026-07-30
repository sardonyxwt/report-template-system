import { type ProfileResponse, isWho } from 'platform/common-base';

export type ScopedUser = Pick<ProfileResponse, 'id' | 'role'>;

/** Clinics owned by the current manager. Admins see all clinics. */
export const managedClinicWhere = (user: ScopedUser) =>
  isWho(user.role).isAdmin ? {} : { managerId: user.id };

/**
 * Entities nested under a clinic owned by the current manager
 * (patients, templates, clinic reports). Admins see everything.
 */
export const managedViaClinicWhere = (user: ScopedUser) =>
  isWho(user.role).isAdmin ? {} : { clinic: { managerId: user.id } };
