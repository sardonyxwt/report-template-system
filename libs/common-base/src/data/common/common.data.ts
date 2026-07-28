import { ZodType, z } from 'zod';
import { Prisma } from 'platform/prisma';
import { aliases } from 'platform/zod';
import { ID_PATH_PARAM_NAME } from '../../constants';

export const ServerApiErrorSchema = z.object({
  body: z.any(),
  status: z.number(),
  statusText: z.string(),
});

export const EconnrefusedErrorSchema = z.object({
  cause: z.object({
    code: z.literal('ECONNREFUSED'),
  }),
});

export const VoidResponseSchema = z.void().meta({ name: 'VoidResponseSchema' });

export const AnyResponseSchema = z.any().meta({ name: 'AnyResponseSchema' });

/**
 * Recursive JSON-value schema used for OpenAPI-compatible arbitrary JSON.
 */
export const JsonSchema: ZodType<Prisma.JsonValue> = z
  .lazy(() =>
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.literal(null),
      z.record(
        z.string(),
        z.lazy(() => JsonSchema.optional()),
      ),
      z.array(z.lazy(() => JsonSchema)),
    ]),
  )
  .transform((value) => value as Prisma.JsonValue)
  .meta({ name: 'JsonSchema' });

export const PageAggregateRequestSchema = z
  .object({
    take: z.number().nonnegative().optional(),
    skip: z.number().nonnegative().optional(),
  })
  .strict()
  .meta({
    name: 'PageAggregateRequestSchema',
  });

/**
 * Prisma-style aggregate request schema for endpoints that expose controlled
 * `findMany` querying to clients.
 */
export const ArgsAggregateRequestSchema = z
  .object({
    orderBy: z.union([z.looseObject({}).array(), z.looseObject({})]).optional(),
    where: z.looseObject({}).optional(),
    cursor: z.looseObject({}).optional(),
    take: z.number().int().nonnegative().optional(),
    skip: z.number().int().nonnegative().optional(),
  })
  .strict()
  .meta({
    name: 'ArgsAggregateRequestSchema',
  });

export const ActionStringIdParamsSchema = z
  .object({
    [ID_PATH_PARAM_NAME]: aliases.notEmptyString,
  })
  .meta({
    name: 'ActionStringIdParamsSchema',
  });

export const ActionNumberIdParamsSchema = z
  .object({
    [ID_PATH_PARAM_NAME]: z.coerce.number().positive(),
  })
  .meta({
    name: 'ActionNumberIdParamsSchema',
  });

/**
 * Creates the standard paginated list response schema used by aggregate
 * endpoints.
 */
export const createManyResponseSchema = <ItemType extends z.ZodType>(
  itemSchema: ItemType,
) =>
  z.object({
    total: z.number(),
    perPage: z.number(),
    items: z.array(itemSchema),
  });
