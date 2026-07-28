import { ZodType } from 'zod';
import { ID_PATH_PARAM_NAME } from '../constants';
import { ActionNumberIdParamsSchema } from '../data/common/common.data';
import {
  ManagerCreateRequestSchema,
  ManagerResponseSchema,
} from '../data/manager/manager.data';
import { HttpStatus, EndpointsTags, HttpMethod } from '../enums';
import { ApiEndpoints } from '../types';

const root = 'manager';

/**
 * Creates shared manager endpoint contracts.
 *
 * Manager mutations also affect the related user role, so the contracts
 * revalidate both manager and user cache tags.
 */
export const createManagerEndpoints = (base = '') =>
  ({
    create: {
      method: HttpMethod.Post,
      path: `${base}/${root}`,
      status: HttpStatus.Created,
      body: ManagerCreateRequestSchema as ZodType,
      response: ManagerResponseSchema as ZodType,
      guards: ['auth'],
      revalidate: [EndpointsTags.User, EndpointsTags.Manager],
    },
    delete: {
      method: HttpMethod.Delete,
      path: `${base}/${root}/:${ID_PATH_PARAM_NAME}`,
      build: (id: number) => `${base}/${root}/${id}`,
      params: ActionNumberIdParamsSchema as ZodType,
      response: ManagerResponseSchema as ZodType,
      guards: ['auth'],
      revalidate: [EndpointsTags.User, EndpointsTags.Manager],
    },
  }) satisfies ApiEndpoints;

export type ManagerEndpoints = ReturnType<typeof createManagerEndpoints>;
