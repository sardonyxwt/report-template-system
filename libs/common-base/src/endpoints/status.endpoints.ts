import { StatusResponseSchema } from '../data/status/status.data';
import { HttpMethod } from '../enums';
import { ApiEndpoints } from '../types';

const root = 'status';

/**
 * Creates endpoint contracts for service health/readiness checks.
 */
export const createStatusEndpoints = (base = '') =>
  ({
    check: {
      method: HttpMethod.Get,
      path: `${base}/${root}`,
      response: StatusResponseSchema,
    },
  }) satisfies ApiEndpoints;

export type StatusEndpoints = ReturnType<typeof createStatusEndpoints>;
