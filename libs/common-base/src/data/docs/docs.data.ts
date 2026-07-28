import { z } from 'zod';

export const DocsJsonResponseSchema = z
  .looseObject({})
  .meta({ name: 'DocsJsonResponse' });
