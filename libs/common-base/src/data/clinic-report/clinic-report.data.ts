import { z } from 'zod';
import { ClinicSimpleSchema } from '../clinic/clinic-simple.data';
import {
  ArgsAggregateRequestSchema,
  createManyResponseSchema,
} from '../common/common.data';
import { PatientSimpleSchema } from '../patient/patient-simple.data';
import { UserSimpleSchema } from '../user/user-simple.data';
import { ClinicReportSimpleSchema } from './clinic-report-simple.data';

export const ClinicReportResponseSchema = z
  .object({
    ...ClinicReportSimpleSchema.shape,
    clinic: ClinicSimpleSchema,
    patient: z.object({
      ...PatientSimpleSchema.shape,
      user: UserSimpleSchema,
    }),
  })
  .meta({ name: 'ClinicReportResponseSchema' });

export const ClinicReportsResponseSchema = createManyResponseSchema(
  ClinicReportResponseSchema,
).meta({ name: 'ClinicReportsResponseSchema' });

export const ClinicReportCreateRequestSchema = z
  .object({
    patientId:
      ClinicReportSimpleSchema.shape.patientId.positive('Select a patient.'),
    clinicId:
      ClinicReportSimpleSchema.shape.clinicId.positive('Select a clinic.'),
  })
  .meta({ name: 'ClinicReportCreateRequestSchema' });

export const ClinicReportAggregateRequestSchema = ArgsAggregateRequestSchema;
