import { z } from 'zod';
import { ManagerSimpleSchema } from './manager-simple.data';
import {
  ManagerCreateRequestSchema,
  ManagerResponseSchema,
} from './manager.data';

export type ManagerSimple = z.infer<typeof ManagerSimpleSchema>;
export type ManagerResponse = z.infer<typeof ManagerResponseSchema>;
export type ManagerCreateRequest = z.infer<typeof ManagerCreateRequestSchema>;
