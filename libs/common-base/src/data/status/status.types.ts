import { z } from 'zod';
import { StatusResponseSchema } from './status.data';

export type StatusResponse = z.infer<typeof StatusResponseSchema>;
