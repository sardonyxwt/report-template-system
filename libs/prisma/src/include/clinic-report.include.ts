import { Prisma } from 'platform/prisma/types';

export const includeClinicReport = {
  clinic: true,
  patient: {
    include: {
      user: true,
    },
  },
} satisfies Prisma.ClinicReportInclude;
