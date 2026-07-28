import { z } from 'zod';
import { ManagerSchema } from 'platform/prisma';

export const ManagerSimpleSchema = z
  .object(ManagerSchema.shape)
  .meta({ name: 'ManagerSimpleSchema' });
