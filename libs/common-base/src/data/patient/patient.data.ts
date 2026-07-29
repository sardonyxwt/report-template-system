import { z } from 'zod';
import { aliases } from 'platform/zod';
import { ClinicSimpleSchema } from '../clinic/clinic-simple.data';
import {
  ArgsAggregateRequestSchema,
  createManyResponseSchema,
} from '../common/common.data';
import { UserSimpleSchema } from '../user/user-simple.data';
import { PatientSimpleSchema } from './patient-simple.data';

export const PatientResponseSchema = z
  .object({
    ...PatientSimpleSchema.shape,
    user: UserSimpleSchema,
    clinic: ClinicSimpleSchema,
  })
  .meta({ name: 'PatientResponseSchema' });

export const PatientsResponseSchema = createManyResponseSchema(
  PatientResponseSchema,
).meta({ name: 'PatientsResponseSchema' });

export const PatientCreateRequestSchema = z
  .object({
    clinicId: PatientSimpleSchema.shape.clinicId.positive('Select a clinic.'),
    email: aliases.email,
  })
  .meta({ name: 'PatientCreateRequestSchema' });

export const PatientAggregateRequestSchema = ArgsAggregateRequestSchema;
