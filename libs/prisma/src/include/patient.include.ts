import { Prisma } from 'platform/prisma/types';

export const includePatient = {
  user: true,
  clinic: true,
} satisfies Prisma.PatientInclude;
