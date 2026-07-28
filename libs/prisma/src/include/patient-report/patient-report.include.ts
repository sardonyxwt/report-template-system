import { Prisma } from 'platform/prisma/types';

export const includePatientReport = {
  report: {
    include: {
      clinic: true,
    },
  },
} satisfies Prisma.PatientReportInclude;
