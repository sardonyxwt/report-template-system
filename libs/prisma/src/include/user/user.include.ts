import { Prisma } from 'platform/prisma/types';
import { includeManagerSimple } from '../manager/manager-simple.include';
import { includeUserSimple } from './user-simple.include';

export const includeUser = {
  ...includeUserSimple,
  manager: {
    include: includeManagerSimple,
  },
} satisfies Prisma.UserInclude;
