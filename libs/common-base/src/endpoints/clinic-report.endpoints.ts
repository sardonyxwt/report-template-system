import { ZodType } from 'zod';
import { ID_PATH_PARAM_NAME } from '../constants';
import {
  ClinicReportAggregateRequestSchema,
  ClinicReportCreateRequestSchema,
  ClinicReportResponseSchema,
  ClinicReportsResponseSchema,
} from '../data/clinic-report/clinic-report.data';
import { ActionNumberIdParamsSchema } from '../data/common/common.data';
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
    delete: {
      method: HttpMethod.Delete,
      path: `${base}/${root}/:${ID_PATH_PARAM_NAME}`,
      build: (id: number) => `${base}/${root}/${id}`,
      params: ActionNumberIdParamsSchema as ZodType,
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
