import { z } from 'zod';
import {
  ClinicReportAggregateRequestSchema,
  ClinicReportCreateRequestSchema,
  ClinicReportResponseSchema,
  ClinicReportsResponseSchema,
} from './clinic-report.data';

export type ClinicReportResponse = z.infer<typeof ClinicReportResponseSchema>;
export type ClinicReportsResponse = z.infer<typeof ClinicReportsResponseSchema>;
export type ClinicReportCreateRequest = z.infer<
  typeof ClinicReportCreateRequestSchema
>;
export type ClinicReportAggregateRequest = z.infer<
  typeof ClinicReportAggregateRequestSchema
>;
