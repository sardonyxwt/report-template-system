import { z } from 'zod';
import { ClinicReportResponseSchema } from '../clinic-report/clinic-report.data';
import {
  ArgsAggregateRequestSchema,
  createManyResponseSchema,
} from '../common/common.data';
import { TemplateSimpleSchema } from '../template/template-simple.data';
import { PatientReportSimpleSchema } from './patient-report-simple.data';

export const PatientReportResponseSchema = z
  .object({
    ...PatientReportSimpleSchema.shape,
    report: ClinicReportResponseSchema,
    template: TemplateSimpleSchema,
  })
  .meta({ name: 'PatientReportResponseSchema' });

export const PatientReportsResponseSchema = createManyResponseSchema(
  PatientReportResponseSchema,
).meta({ name: 'PatientReportsResponseSchema' });

export const PatientReportCreateRequestSchema = z
  .object({
    reportId: PatientReportSimpleSchema.shape.reportId.positive(
      'Select a clinic report.',
    ),
    templateId:
      PatientReportSimpleSchema.shape.templateId.positive('Select a template.'),
  })
  .meta({ name: 'PatientReportCreateRequestSchema' });

export const PatientReportAggregateRequestSchema = ArgsAggregateRequestSchema;
