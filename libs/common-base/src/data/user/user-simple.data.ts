import { z } from 'zod';
import { UserSchema } from 'platform/prisma';

export const UserSimpleSchema = z
  .object({
    ...UserSchema.omit({
      accessToken: true,
      refreshToken: true,
    }).shape,
  })
  .meta({
    name: 'UserSimpleSchema',
  });
