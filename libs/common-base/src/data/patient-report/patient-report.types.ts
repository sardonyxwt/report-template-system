import { z } from 'zod';
import {
  PatientReportAggregateRequestSchema,
  PatientReportCreateRequestSchema,
  PatientReportResponseSchema,
  PatientReportsResponseSchema,
} from './patient-report.data';

export type PatientReportResponse = z.infer<typeof PatientReportResponseSchema>;
export type PatientReportsResponse = z.infer<
  typeof PatientReportsResponseSchema
>;
export type PatientReportCreateRequest = z.infer<
  typeof PatientReportCreateRequestSchema
>;
export type PatientReportAggregateRequest = z.infer<
  typeof PatientReportAggregateRequestSchema
>;
