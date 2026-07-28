import { Prisma } from 'platform/prisma/types';
import { includeUser } from '../user/user.include';
import { includeManagerSimple } from './manager-simple.include';

export const includeManager = {
  ...includeManagerSimple,
  user: {
    include: includeUser,
  },
} satisfies Prisma.ManagerInclude;
