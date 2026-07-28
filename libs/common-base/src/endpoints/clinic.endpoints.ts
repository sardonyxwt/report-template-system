import { ZodType } from 'zod';
import { ID_PATH_PARAM_NAME } from '../constants';
import {
  ClinicAggregateRequestSchema,
  ClinicCreateRequestSchema,
  ClinicResponseSchema,
  ClinicsResponseSchema,
  ClinicUpdateRequestSchema,
} from '../data/clinic/clinic.data';
import { ActionNumberIdParamsSchema } from '../data/common/common.data';
import { HttpMethod, HttpStatus } from '../enums';
import { ApiEndpoints } from '../types';

const root = 'clinic';

export const createClinicEndpoints = (base = '') =>
  ({
    create: {
      method: HttpMethod.Post,
      path: `${base}/${root}`,
      status: HttpStatus.Created,
      body: ClinicCreateRequestSchema as ZodType,
      response: ClinicResponseSchema as ZodType,
      guards: ['auth'],
    },
    update: {
      method: HttpMethod.Put,
      path: `${base}/${root}`,
      body: ClinicUpdateRequestSchema as ZodType,
      response: ClinicResponseSchema as ZodType,
      guards: ['auth'],
    },
    delete: {
      method: HttpMethod.Delete,
      path: `${base}/${root}/:${ID_PATH_PARAM_NAME}`,
      build: (id: number) => `${base}/${root}/${id}`,
      params: ActionNumberIdParamsSchema as ZodType,
      response: ClinicResponseSchema as ZodType,
      guards: ['auth'],
    },
    findMany: {
      method: HttpMethod.Post,
      path: `${base}/${root}/select`,
      body: ClinicAggregateRequestSchema as ZodType,
      response: ClinicsResponseSchema as ZodType,
      guards: ['auth'],
    },
  }) satisfies ApiEndpoints;

export type ClinicEndpoints = ReturnType<typeof createClinicEndpoints>;
