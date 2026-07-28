import { ZodType } from 'zod';
import { ID_PATH_PARAM_NAME } from '../constants';
import { ActionNumberIdParamsSchema } from '../data/common/common.data';
import {
  UserAggregateRequestSchema,
  UserCreateRequestSchema,
  UserResponseSchema,
  UsersResponseSchema,
  UserUpdateRequestSchema,
} from '../data/user/user.data';
import { HttpStatus, EndpointsTags, HttpMethod } from '../enums';
import { ApiEndpoints } from '../types';

const root = 'user';

/**
 * Creates shared user endpoint contracts.
 *
 * The map includes admin-style CRUD and aggregate selection. Mutation
 * endpoints declare `revalidate` tags so client adapters can keep user-related
 * caches consistent.
 */
export const createUserEndpoints = (base = '') =>
  ({
    create: {
      method: HttpMethod.Post,
      path: `${base}/${root}`,
      status: HttpStatus.Created,
      body: UserCreateRequestSchema as ZodType,
      response: UserResponseSchema as ZodType,
      guards: ['auth'],
      revalidate: [
        EndpointsTags.User,
        EndpointsTags.Author,
        EndpointsTags.Manager,
      ],
    },
    update: {
      method: HttpMethod.Put,
      path: `${base}/${root}`,
      body: UserUpdateRequestSchema as ZodType,
      response: UserResponseSchema as ZodType,
      guards: ['auth'],
      revalidate: [
        EndpointsTags.User,
        EndpointsTags.Author,
        EndpointsTags.Manager,
      ],
    },
    delete: {
      method: HttpMethod.Delete,
      path: `${base}/${root}/model/:${ID_PATH_PARAM_NAME}`,
      build: (id: number) => `${base}/${root}/model/${id}`,
      params: ActionNumberIdParamsSchema as ZodType,
      response: UserResponseSchema as ZodType,
      guards: ['auth'],
      revalidate: [
        EndpointsTags.User,
        EndpointsTags.Author,
        EndpointsTags.Manager,
      ],
    },
    findMany: {
      method: HttpMethod.Post,
      path: `${base}/${root}/select`,
      body: UserAggregateRequestSchema as ZodType,
      response: UsersResponseSchema as ZodType,
      guards: ['auth'],
      tags: [EndpointsTags.User],
    },
  }) satisfies ApiEndpoints;

export type UserEndpoints = ReturnType<typeof createUserEndpoints>;
