import { z } from 'zod';
import { PatientReportSchema } from 'platform/prisma';

export const PatientReportSimpleSchema = z
  .object(PatientReportSchema.shape)
  .meta({ name: 'PatientReportSimpleSchema' });
