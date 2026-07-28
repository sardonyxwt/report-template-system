import { DocsJsonResponseSchema } from '../data/docs/docs.data';
import { HttpMethod } from '../enums';
import { ApiEndpoints } from '../types';

const root = 'docs';

/**
 * Creates endpoint contracts for generated documentation artifacts.
 */
export const createDocsEndpoints = (base = '') =>
  ({
    json: {
      method: HttpMethod.Get,
      path: `${base}/${root}/openapi.json`,
      response: DocsJsonResponseSchema,
    },
  }) satisfies ApiEndpoints;

export type DocsEndpoints = ReturnType<typeof createDocsEndpoints>;
