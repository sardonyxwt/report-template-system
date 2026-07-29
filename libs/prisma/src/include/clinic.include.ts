import { Prisma } from 'platform/prisma/types';

export const includeClinic = {
  manager: {
    include: {
      user: true,
    },
  },
} satisfies Prisma.ClinicInclude;
