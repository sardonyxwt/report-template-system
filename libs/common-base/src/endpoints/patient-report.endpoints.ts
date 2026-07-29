import { ZodType } from 'zod';
import { ID_PATH_PARAM_NAME, PDF_MIMETYPE } from '../constants';
import { ActionNumberIdParamsSchema } from '../data/common/common.data';
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
    delete: {
      method: HttpMethod.Delete,
      path: `${base}/${root}/:${ID_PATH_PARAM_NAME}`,
      build: (reportId: number) => `${base}/${root}/${reportId}`,
      params: ActionNumberIdParamsSchema as ZodType,
      response: PatientReportResponseSchema as ZodType,
      guards: ['auth'],
    },
    downloadPdf: {
      method: HttpMethod.Get,
      path: `${base}/${root}/:${ID_PATH_PARAM_NAME}/pdf`,
      build: (reportId: number) => `${base}/${root}/${reportId}/pdf`,
      headers: {
        'Cache-Control': 'no-store',
      },
      params: ActionNumberIdParamsSchema as ZodType,
      response: {
        type: 'file',
        mimetype: [PDF_MIMETYPE],
      },
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
