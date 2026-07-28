import { Prisma } from 'platform/prisma/client';

export const clinicReportFixtures = {
  report(
    clinicId: number,
    patientId: number,
    overrides: Partial<
      Omit<Prisma.ClinicReportUncheckedCreateInput, 'clinicId' | 'patientId'>
    > = {},
  ) {
    return {
      clinicId,
      patientId,
      data: {
        blocks: [
          {
            type: 'summary',
            value: {
              content: 'Patient health summary',
              author: 'Test Doctor',
            },
          },
        ],
      },
      ...overrides,
    } satisfies Prisma.ClinicReportUncheckedCreateInput;
  },
};
