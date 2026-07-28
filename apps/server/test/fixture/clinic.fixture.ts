import { ClinicCreateRequest } from 'platform/common-base';

export const clinicFixtures = {
  clinic(
    managerId: number,
    overrides: Partial<Omit<ClinicCreateRequest, 'managerId'>> = {},
  ) {
    return {
      managerId,
      name: 'Test Clinic',
      ...overrides,
    } satisfies ClinicCreateRequest;
  },
};
