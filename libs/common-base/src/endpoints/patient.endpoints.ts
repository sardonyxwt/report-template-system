import { ZodType } from 'zod';
import { ID_PATH_PARAM_NAME } from '../constants';
import { ActionNumberIdParamsSchema } from '../data/common/common.data';
import {
  PatientAggregateRequestSchema,
  PatientCreateRequestSchema,
  PatientResponseSchema,
  PatientsResponseSchema,
} from '../data/patient/patient.data';
import { HttpMethod, HttpStatus } from '../enums';
import { ApiEndpoints } from '../types';

const root = 'patient';

export const createPatientEndpoints = (base = '') =>
  ({
    create: {
      method: HttpMethod.Post,
      path: `${base}/${root}`,
      status: HttpStatus.Created,
      body: PatientCreateRequestSchema as ZodType,
      response: PatientResponseSchema as ZodType,
      guards: ['auth'],
    },
    delete: {
      method: HttpMethod.Delete,
      path: `${base}/${root}/:${ID_PATH_PARAM_NAME}`,
      build: (id: number) => `${base}/${root}/${id}`,
      params: ActionNumberIdParamsSchema as ZodType,
      response: PatientResponseSchema as ZodType,
      guards: ['auth'],
    },
    findMany: {
      method: HttpMethod.Post,
      path: `${base}/${root}/select`,
      body: PatientAggregateRequestSchema as ZodType,
      response: PatientsResponseSchema as ZodType,
      guards: ['auth'],
    },
  }) satisfies ApiEndpoints;

export type PatientEndpoints = ReturnType<typeof createPatientEndpoints>;
