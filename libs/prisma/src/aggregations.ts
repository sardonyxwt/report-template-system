import { Prisma } from 'platform/prisma/types';

export const searchQueryOrUndef = (
  value?: string | null,
  minLength = 1,
): Prisma.StringFilter | undefined =>
  typeof value === 'string' && value.length >= minLength
    ? ({ contains: value, mode: 'insensitive' } satisfies Prisma.StringFilter)
    : undefined;
