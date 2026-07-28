import { ZodType } from 'zod';
import {
  PatientReportAggregateRequestSchema,
  PatientReportCreateRequestSchema,
  PatientReportResponseSchema,
  PatientReportsResponseSchema,
} from '../data/patient-report/patient-report.data';
import { HttpMethod, HttpStatus } from '../enums';
import { ApiEndpoints } from '../types';

const root = 'patient-report';

export const createPatientReportEndpoints = (base = '') =>
  ({
    create: {
      method: HttpMethod.Post,
      path: `${base}/${root}`,
      status: HttpStatus.Created,
      body: PatientReportCreateRequestSchema as ZodType,
      response: PatientReportResponseSchema as ZodType,
      guards: ['auth'],
    },
    findMany: {
      method: HttpMethod.Post,
      path: `${base}/${root}/select`,
      body: PatientReportAggregateRequestSchema as ZodType,
      response: PatientReportsResponseSchema as ZodType,
      guards: ['auth'],
    },
  }) satisfies ApiEndpoints;

export type PatientReportEndpoints = ReturnType<
  typeof createPatientReportEndpoints
>;
