import { z } from 'zod';
import {
  ArgsAggregateRequestSchema,
  createManyResponseSchema,
} from '../common/common.data';
import { ManagerResponseSchema } from '../manager/manager.data';
import { ClinicSimpleSchema } from './clinic-simple.data';

export const ClinicResponseSchema = z
  .object({
    ...ClinicSimpleSchema.shape,
    manager: ManagerResponseSchema,
  })
  .meta({ name: 'ClinicResponseSchema' });

export const ClinicsResponseSchema = createManyResponseSchema(
  ClinicResponseSchema,
).meta({ name: 'ClinicsResponseSchema' });

export const ClinicCreateRequestSchema = ClinicSimpleSchema.omit({
  id: true,
}).meta({ name: 'ClinicCreateRequestSchema' });

export const ClinicUpdateRequestSchema = z
  .object(ClinicSimpleSchema.shape)
  .meta({ name: 'ClinicUpdateRequestSchema' });

export const ClinicAggregateRequestSchema = ArgsAggregateRequestSchema;
