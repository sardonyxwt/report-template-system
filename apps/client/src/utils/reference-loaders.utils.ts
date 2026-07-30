import {
  type ClinicResponse,
  type PatientResponse,
  type UserResponse,
  isWho,
  REFERENCE_ITEMS_LIMIT,
} from 'platform/common-base';
import { searchQueryOrUndef, UserRole } from 'platform/prisma';
import { api } from '../api/client.api';
import {
  type ScopedUser,
  managedClinicWhere,
  managedViaClinicWhere,
} from './scope.utils';

export const loadClinics = async (
  user: ScopedUser,
  search = '',
): Promise<ClinicResponse[]> => {
  const response = await api.clinic.findMany({
    where: {
      AND: [
        managedClinicWhere(user),
        search ? { name: searchQueryOrUndef(search) } : {},
      ],
    },
    orderBy: { name: 'asc' },
    take: REFERENCE_ITEMS_LIMIT,
  });
  return response.items;
};

export const loadPatients = async (
  user: ScopedUser,
  search = '',
): Promise<PatientResponse[]> => {
  const response = await api.patient.findMany({
    where: {
      AND: [
        managedViaClinicWhere(user),
        search
          ? {
              user: {
                OR: [
                  { fullName: searchQueryOrUndef(search) },
                  { email: searchQueryOrUndef(search) },
                ],
              },
            }
          : {},
      ],
    },
    orderBy: { userId: 'asc' },
    take: REFERENCE_ITEMS_LIMIT,
  });
  return response.items;
};

export const loadPatientsByClinic = async (
  user: ScopedUser,
  clinicId: number,
): Promise<PatientResponse[]> => {
  const response = await api.patient.findMany({
    where: {
      AND: [managedViaClinicWhere(user), { clinicId }],
    },
    orderBy: { userId: 'asc' },
    take: REFERENCE_ITEMS_LIMIT,
  });
  return response.items;
};

export const loadManagers = async (
  user: ScopedUser,
  search = '',
): Promise<UserResponse[]> => {
  if (!isWho(user.role).isAdmin) {
    return [user as UserResponse];
  }

  const response = await api.user.findMany({
    where: {
      role: UserRole.Manager,
      ...(search
        ? {
            OR: [
              { fullName: searchQueryOrUndef(search) },
              { email: searchQueryOrUndef(search) },
            ],
          }
        : {}),
    },
    orderBy: { email: 'asc' },
    take: REFERENCE_ITEMS_LIMIT,
  });
  return response.items;
};
