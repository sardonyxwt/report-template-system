import { z } from 'zod';
import { PatientSchema } from 'platform/prisma';
import { aliases } from 'platform/zod';
import {
  ArgsAggregateRequestSchema,
  createManyResponseSchema,
} from '../common/common.data';
import { UserSimpleSchema } from '../user/user-simple.data';

export const PatientResponseSchema = z
  .object({
    ...PatientSchema.shape,
    user: UserSimpleSchema,
  })
  .meta({ name: 'PatientResponseSchema' });

export const PatientsResponseSchema = createManyResponseSchema(
  PatientResponseSchema,
).meta({ name: 'PatientsResponseSchema' });

export const PatientCreateRequestSchema = z
  .object({
    clinicId: PatientSchema.shape.clinicId,
    email: aliases.email,
  })
  .meta({ name: 'PatientCreateRequestSchema' });

export const PatientAggregateRequestSchema = ArgsAggregateRequestSchema;
