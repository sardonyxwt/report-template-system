import { z } from 'zod';
import { ManagerSchema } from 'platform/prisma';
import { UserSimpleSchema } from '../user/user-simple.data';
import { ManagerSimpleSchema } from './manager-simple.data';

export const ManagerResponseSchema = z
  .object({
    ...ManagerSimpleSchema.shape,
    user: UserSimpleSchema.omit({
      id: true,
    }),
  })
  .meta({ name: 'ManagerResponseSchema' });

export const ManagerCreateRequestSchema = z
  .object({
    ...ManagerSchema.shape,
    userId: ManagerSchema.shape.userId.positive(),
  })
  .meta({
    name: 'ManagerCreateRequestSchema',
  });
