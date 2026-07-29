import { z } from 'zod';
import { PatientReportSimpleSchema } from './patient-report-simple.data';
import {
  PatientReportAggregateRequestSchema,
  PatientReportCreateRequestSchema,
  PatientReportResponseSchema,
  PatientReportsResponseSchema,
} from './patient-report.data';

export type PatientReportSimple = z.infer<typeof PatientReportSimpleSchema>;
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
