import { z } from 'zod';
import { ClinicReportSchema } from 'platform/prisma';

export const ClinicReportSimpleSchema = z
  .object(ClinicReportSchema.shape)
  .meta({ name: 'ClinicReportSimpleSchema' });
