import { ZodType } from 'zod';
import {
  ClinicReportAggregateRequestSchema,
  ClinicReportCreateRequestSchema,
  ClinicReportResponseSchema,
  ClinicReportsResponseSchema,
} from '../data/clinic-report/clinic-report.data';
import { HttpMethod, HttpStatus } from '../enums';
import { ApiEndpoints } from '../types';

const root = 'clinic-report';

export const createClinicReportEndpoints = (base = '') =>
  ({
    create: {
      method: HttpMethod.Post,
      path: `${base}/${root}`,
      status: HttpStatus.Created,
      body: ClinicReportCreateRequestSchema as ZodType,
      response: ClinicReportResponseSchema as ZodType,
      guards: ['auth'],
    },
    findMany: {
      method: HttpMethod.Post,
      path: `${base}/${root}/select`,
      body: ClinicReportAggregateRequestSchema as ZodType,
      response: ClinicReportsResponseSchema as ZodType,
      guards: ['auth'],
    },
  }) satisfies ApiEndpoints;

export type ClinicReportEndpoints = ReturnType<
  typeof createClinicReportEndpoints
>;
