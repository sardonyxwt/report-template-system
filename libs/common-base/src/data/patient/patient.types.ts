import { z } from 'zod';
import {
  PatientAggregateRequestSchema,
  PatientCreateRequestSchema,
  PatientResponseSchema,
  PatientsResponseSchema,
} from './patient.data';

export type PatientResponse = z.infer<typeof PatientResponseSchema>;
export type PatientsResponse = z.infer<typeof PatientsResponseSchema>;
export type PatientCreateRequest = z.infer<typeof PatientCreateRequestSchema>;
export type PatientAggregateRequest = z.infer<
  typeof PatientAggregateRequestSchema
>;
