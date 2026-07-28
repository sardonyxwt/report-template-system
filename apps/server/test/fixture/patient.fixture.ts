import { PatientCreateRequest } from 'platform/common-base';

export const patientFixtures = {
  patient(
    clinicId: number,
    email: string,
    overrides: Partial<Omit<PatientCreateRequest, 'clinicId' | 'email'>> = {},
  ) {
    return {
      clinicId,
      email,
      ...overrides,
    } satisfies PatientCreateRequest;
  },
};
