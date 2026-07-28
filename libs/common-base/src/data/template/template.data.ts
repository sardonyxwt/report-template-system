import { z } from 'zod';
import { TemplateSchema } from 'platform/prisma';
import {
  ArgsAggregateRequestSchema,
  createManyResponseSchema,
} from '../common/common.data';

const validateTemplate = (
  { data }: Pick<z.infer<typeof TemplateSchema>, 'data'>,
  context: z.RefinementCtx,
) => {
  const blockTypes = new Set<string>();

  data.blocks.forEach((block, index) => {
    if (blockTypes.has(block.type)) {
      context.addIssue({
        code: 'custom',
        message: `Duplicate template block type: ${block.type}`,
        path: ['data', 'blocks', index, 'type'],
      });
    }

    blockTypes.add(block.type);
  });
};

export const TemplateResponseSchema = z
  .object(TemplateSchema.shape)
  .superRefine(validateTemplate)
  .meta({ name: 'TemplateResponseSchema' });

export const TemplatesResponseSchema = createManyResponseSchema(
  TemplateResponseSchema,
).meta({ name: 'TemplatesResponseSchema' });

export const TemplateCreateRequestSchema = TemplateSchema.omit({
  id: true,
})
  .superRefine(validateTemplate)
  .meta({ name: 'TemplateCreateRequestSchema' });

export const TemplateUpdateRequestSchema = z
  .object(TemplateSchema.shape)
  .superRefine(validateTemplate)
  .meta({ name: 'TemplateUpdateRequestSchema' });

export const TemplateAggregateRequestSchema = ArgsAggregateRequestSchema;
