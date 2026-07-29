import { z } from 'zod';
import { ClinicSimpleSchema } from './clinic-simple.data';
import {
  ClinicAggregateRequestSchema,
  ClinicCreateRequestSchema,
  ClinicResponseSchema,
  ClinicsResponseSchema,
  ClinicUpdateRequestSchema,
} from './clinic.data';

export type ClinicSimple = z.infer<typeof ClinicSimpleSchema>;
export type ClinicResponse = z.infer<typeof ClinicResponseSchema>;
export type ClinicsResponse = z.infer<typeof ClinicsResponseSchema>;
export type ClinicCreateRequest = z.infer<typeof ClinicCreateRequestSchema>;
export type ClinicUpdateRequest = z.infer<typeof ClinicUpdateRequestSchema>;
export type ClinicAggregateRequest = z.infer<
  typeof ClinicAggregateRequestSchema
>;
