import { ZodType } from 'zod';
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
    findMany: {
      method: HttpMethod.Post,
      path: `${base}/${root}/select`,
      body: PatientAggregateRequestSchema as ZodType,
      response: PatientsResponseSchema as ZodType,
      guards: ['auth'],
    },
  }) satisfies ApiEndpoints;

export type PatientEndpoints = ReturnType<typeof createPatientEndpoints>;
