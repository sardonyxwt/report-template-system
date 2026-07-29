import { z } from 'zod';
import { PatientSimpleSchema } from './patient-simple.data';
import {
  PatientAggregateRequestSchema,
  PatientCreateRequestSchema,
  PatientResponseSchema,
  PatientsResponseSchema,
} from './patient.data';

export type PatientSimple = z.infer<typeof PatientSimpleSchema>;
export type PatientResponse = z.infer<typeof PatientResponseSchema>;
export type PatientsResponse = z.infer<typeof PatientsResponseSchema>;
export type PatientCreateRequest = z.infer<typeof PatientCreateRequestSchema>;
export type PatientAggregateRequest = z.infer<
  typeof PatientAggregateRequestSchema
>;
