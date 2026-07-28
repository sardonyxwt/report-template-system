import { z } from 'zod';
import { DocsJsonResponseSchema } from './docs.data';

export type DocsJsonResponse = z.infer<typeof DocsJsonResponseSchema>;
