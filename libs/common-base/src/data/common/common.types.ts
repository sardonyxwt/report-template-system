import { z } from 'zod';
import {
  ActionNumberIdParamsSchema,
  ActionStringIdParamsSchema,
  AnyResponseSchema,
  PageAggregateRequestSchema,
  VoidResponseSchema,
  createManyResponseSchema,
  ServerApiErrorSchema,
  EconnrefusedErrorSchema,
} from './common.data';

export type ServerApiError = z.infer<typeof ServerApiErrorSchema>;
export type EconnrefusedError = z.infer<typeof EconnrefusedErrorSchema>;
export type VoidResponse = z.infer<typeof VoidResponseSchema>;
export type AnyResponse = z.infer<typeof AnyResponseSchema>;
export type PageAggregateRequest = z.infer<typeof PageAggregateRequestSchema>;
export type ArgsAggregateRequest<WHERE, ORDER, CURSOR> = {
  where?: WHERE;
  orderBy?: ORDER | ORDER[];
  cursor?: CURSOR;
  take?: number;
  skip?: number;
};
export type ActionStringIdParams = z.infer<typeof ActionStringIdParamsSchema>;
export type ActionNumberIdParams = z.infer<typeof ActionNumberIdParamsSchema>;
export type ManyResponse<ItemType extends z.ZodTypeAny = z.ZodTypeAny> =
  ReturnType<typeof createManyResponseSchema<ItemType>>;
