import { z } from 'zod';
import { UserSchema } from 'platform/prisma';
import {
  ArgsAggregateRequestSchema,
  createManyResponseSchema,
} from '../common/common.data';
import { ManagerSimpleSchema } from '../manager/manager-simple.data';
import { UserSimpleSchema } from './user-simple.data';

export const UserResponseSchema = z
  .object({
    ...UserSimpleSchema.shape,
    manager: ManagerSimpleSchema.nullish(),
  })
  .meta({
    name: 'UserResponseSchema',
  });

export const UsersResponseSchema = createManyResponseSchema(
  UserResponseSchema,
).meta({
  name: 'UsersResponseSchema',
});

export const UserSaveSchema = UserSchema.omit({
  accessToken: true,
  refreshToken: true,
});

export const UserCreateRequestSchema = UserSaveSchema.omit({
  id: true,
  role: true,
}).meta({
  name: 'UserCreateRequestSchema',
});

export const UserUpdateRequestSchema = UserSaveSchema.omit({
  role: true,
}).meta({
  name: 'UserUpdateRequestSchema',
});

export const UserAggregateRequestSchema = ArgsAggregateRequestSchema;
