import { z } from 'zod';
import { PatientSchema } from 'platform/prisma';

export const PatientSimpleSchema = z
  .object(PatientSchema.shape)
  .meta({ name: 'PatientSimpleSchema' });
