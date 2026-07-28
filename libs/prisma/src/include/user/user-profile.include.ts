import { Prisma } from 'platform/prisma/types';
import { includeUser } from './user.include';

export const includeUserProfile = {
  ...includeUser,
} satisfies Prisma.UserInclude;
