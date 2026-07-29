import { z } from 'zod';
import { ClinicSchema } from 'platform/prisma';

export const ClinicSimpleSchema = z
  .object({
    ...ClinicSchema.shape,
    managerId: ClinicSchema.shape.managerId.positive('Select a manager.'),
    name: ClinicSchema.shape.name.trim().min(1, 'Clinic name is required.'),
  })
  .meta({ name: 'ClinicSimpleSchema' });
