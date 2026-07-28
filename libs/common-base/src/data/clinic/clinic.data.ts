import { z } from 'zod';
import { ClinicSchema } from 'platform/prisma';
import {
  ArgsAggregateRequestSchema,
  createManyResponseSchema,
} from '../common/common.data';

export const ClinicResponseSchema = z
  .object(ClinicSchema.shape)
  .meta({ name: 'ClinicResponseSchema' });

export const ClinicsResponseSchema = createManyResponseSchema(
  ClinicResponseSchema,
).meta({ name: 'ClinicsResponseSchema' });

export const ClinicCreateRequestSchema = ClinicSchema.omit({
  id: true,
}).meta({ name: 'ClinicCreateRequestSchema' });

export const ClinicUpdateRequestSchema = z
  .object(ClinicSchema.shape)
  .meta({ name: 'ClinicUpdateRequestSchema' });

export const ClinicAggregateRequestSchema = ArgsAggregateRequestSchema;
