import { z } from 'zod';

const HealthIndicatorValue = z.union([z.string(), z.number(), z.boolean()]);

const HealthIndicatorEntry = z
  .object({ status: z.enum(['up', 'down']) })
  .catchall(HealthIndicatorValue);

const HealthIndicatorResultSchema = z.record(z.string(), HealthIndicatorEntry);

export const StatusResponseSchema = z
  .object({
    status: z.enum(['ok', 'error', 'shutting_down']),
    info: HealthIndicatorResultSchema.optional(),
    error: HealthIndicatorResultSchema.optional(),
    details: HealthIndicatorResultSchema,
  })
  .meta({ name: 'StatusResponseSchema' });
