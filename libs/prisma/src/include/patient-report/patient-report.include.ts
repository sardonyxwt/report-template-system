import { Prisma } from 'platform/prisma/types';

export const includePatientReport = {
  report: {
    include: {
      clinic: true,
      patient: {
        include: {
          user: true,
        },
      },
    },
  },
  template: true,
} satisfies Prisma.PatientReportInclude;
