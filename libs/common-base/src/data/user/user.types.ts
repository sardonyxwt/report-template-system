import { z } from 'zod';
import { Prisma } from 'platform/prisma';
import { ArgsAggregateRequest } from '../common/common.types';
import { UserSimpleSchema } from './user-simple.data';
import {
  UserCreateRequestSchema,
  UserResponseSchema,
  UserUpdateRequestSchema,
  UsersResponseSchema,
} from './user.data';

export type UserSimple = z.infer<typeof UserSimpleSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UsersResponse = z.infer<typeof UsersResponseSchema>;
export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>;
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;
export type UserAggregateRequest = ArgsAggregateRequest<
  Prisma.UserWhereInput,
  Prisma.UserOrderByWithRelationInput,
  Prisma.UserWhereUniqueInput
>;
