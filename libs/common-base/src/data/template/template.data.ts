import { z } from 'zod';
import { TemplateBlockTypeSchema } from 'platform/prisma';
import { ClinicSimpleSchema } from '../clinic/clinic-simple.data';
import {
  ArgsAggregateRequestSchema,
  createManyResponseSchema,
} from '../common/common.data';
import { TemplateSimpleSchema } from './template-simple.data';

const validateTemplate = (
  { data }: Pick<z.infer<typeof TemplateSimpleSchema>, 'data'>,
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
  .object({
    ...TemplateSimpleSchema.shape,
    clinic: ClinicSimpleSchema,
  })
  .superRefine(validateTemplate)
  .meta({ name: 'TemplateResponseSchema' });

export const TemplatesResponseSchema = createManyResponseSchema(
  TemplateResponseSchema,
).meta({ name: 'TemplatesResponseSchema' });

export const TemplateCreateRequestSchema = TemplateSimpleSchema.omit({
  id: true,
})
  .superRefine(validateTemplate)
  .meta({ name: 'TemplateCreateRequestSchema' });

export const TemplateUpdateRequestSchema = z
  .object(TemplateSimpleSchema.shape)
  .superRefine(validateTemplate)
  .meta({ name: 'TemplateUpdateRequestSchema' });

export const TemplatePreviewRequestSchema = z
  .object({
    data: TemplateSimpleSchema.shape.data,
    blockType: TemplateBlockTypeSchema.optional(),
  })
  .meta({ name: 'TemplatePreviewRequestSchema' });

export const TemplatePreviewResponseSchema = z
  .string()
  .meta({ name: 'TemplatePreviewResponseSchema' });

export const TemplateAiReasoningEffortSchema = z
  .enum(['low', 'medium', 'high'])
  .meta({ name: 'TemplateAiReasoningEffortSchema' });

export const TemplateAiEditRequestSchema = z
  .object({
    data: TemplateSimpleSchema.shape.data,
    blockType: TemplateBlockTypeSchema.optional(),
    prompt: z.string().trim().min(1).max(10_000),
    model: z.string().trim().min(1),
    reasoningEffort: TemplateAiReasoningEffortSchema.default('low'),
    speed: z.boolean().default(false),
    visualValidation: z.boolean().default(false),
    contextId: z.string().trim().min(1).max(256).optional(),
  })
  .superRefine(({ data, blockType }, context) => {
    if (blockType && !data.blocks.some((block) => block.type === blockType)) {
      context.addIssue({
        code: 'custom',
        message: `Template block is missing: ${blockType}`,
        path: ['blockType'],
      });
    }
  })
  .meta({ name: 'TemplateAiEditRequestSchema' });

export const TemplateAiEditResponseSchema = z
  .object({
    data: TemplateSimpleSchema.shape.data,
    contextId: z.string().min(1),
  })
  .meta({ name: 'TemplateAiEditResponseSchema' });

export const TemplateAiEditProgressEventSchema = z
  .object({
    type: z.literal('progress'),
    data: z.object({
      stage: z.enum([
        'queued',
        'thinking',
        'rendering',
        'reviewing',
        'finalizing',
      ]),
      message: z.string().min(1),
    }),
  })
  .meta({ name: 'TemplateAiEditProgressEventSchema' });

export const TemplateAiEditEventSchema = z
  .discriminatedUnion('type', [
    TemplateAiEditProgressEventSchema,
    z.object({
      type: z.literal('result'),
      data: TemplateAiEditResponseSchema,
    }),
    z.object({
      type: z.literal('error'),
      data: z.object({
        message: z.string().min(1),
      }),
    }),
  ])
  .meta({ name: 'TemplateAiEditEventSchema' });

export const TemplateAggregateRequestSchema = ArgsAggregateRequestSchema;
