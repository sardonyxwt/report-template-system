import { z } from 'zod';
import { TemplateSchema } from 'platform/prisma';

export const TemplateSimpleSchema = z
  .object({
    ...TemplateSchema.shape,
    clinicId: TemplateSchema.shape.clinicId.positive('Select a clinic.'),
    name: TemplateSchema.shape.name.trim().min(1, 'Template name is required.'),
  })
  .meta({ name: 'TemplateSimpleSchema' });
