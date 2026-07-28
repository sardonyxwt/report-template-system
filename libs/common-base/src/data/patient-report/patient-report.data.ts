import { z } from 'zod';
import { PatientReportSchema } from 'platform/prisma';
import { ClinicReportResponseSchema } from '../clinic-report/clinic-report.data';
import {
  ArgsAggregateRequestSchema,
  createManyResponseSchema,
} from '../common/common.data';

export const PatientReportResponseSchema = z
  .object({
    ...PatientReportSchema.shape,
    report: ClinicReportResponseSchema,
  })
  .meta({ name: 'PatientReportResponseSchema' });

export const PatientReportsResponseSchema = createManyResponseSchema(
  PatientReportResponseSchema,
).meta({ name: 'PatientReportsResponseSchema' });

export const PatientReportCreateRequestSchema = z
  .object(PatientReportSchema.shape)
  .meta({ name: 'PatientReportCreateRequestSchema' });

export const PatientReportAggregateRequestSchema = ArgsAggregateRequestSchema;
