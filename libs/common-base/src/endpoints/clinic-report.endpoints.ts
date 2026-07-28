import { ZodType } from 'zod';
import {
  ClinicReportAggregateRequestSchema,
  ClinicReportsResponseSchema,
} from '../data/clinic-report/clinic-report.data';
import { HttpMethod } from '../enums';
import { ApiEndpoints } from '../types';

const root = 'clinic-report';

export const createClinicReportEndpoints = (base = '') =>
  ({
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
