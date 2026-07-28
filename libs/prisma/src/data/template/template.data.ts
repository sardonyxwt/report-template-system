import { z } from 'zod';

export const TemplateBlockTypeSchema = z.enum([
  'cover',
  'summary',
  'story',
  'goals',
  'plan',
  'orders',
  'timeline',
  'coach',
  'healthDeepDive',
]);

export const TemplateMarkupSchema = z.string().trim().min(1);

export const TemplateCoverBlockSchema = z.object({
  type: z.literal(TemplateBlockTypeSchema.enum.cover),
  enabled: z.boolean(),
  template: TemplateMarkupSchema,
});

export const TemplateSummaryBlockSchema = z.object({
  type: z.literal(TemplateBlockTypeSchema.enum.summary),
  enabled: z.boolean(),
  template: TemplateMarkupSchema,
});

export const TemplateStoryBlockSchema = z.object({
  type: z.literal(TemplateBlockTypeSchema.enum.story),
  enabled: z.boolean(),
  template: TemplateMarkupSchema,
});

export const TemplateGoalsBlockSchema = z.object({
  type: z.literal(TemplateBlockTypeSchema.enum.goals),
  enabled: z.boolean(),
  template: TemplateMarkupSchema,
});

export const TemplatePlanBlockSchema = z.object({
  type: z.literal(TemplateBlockTypeSchema.enum.plan),
  enabled: z.boolean(),
  template: TemplateMarkupSchema,
});

export const TemplateOrdersBlockSchema = z.object({
  type: z.literal(TemplateBlockTypeSchema.enum.orders),
  enabled: z.boolean(),
  template: TemplateMarkupSchema,
});

export const TemplateTimelineBlockSchema = z.object({
  type: z.literal(TemplateBlockTypeSchema.enum.timeline),
  enabled: z.boolean(),
  template: TemplateMarkupSchema,
});

export const TemplateCoachBlockSchema = z.object({
  type: z.literal(TemplateBlockTypeSchema.enum.coach),
  enabled: z.boolean(),
  template: TemplateMarkupSchema,
});

export const TemplateHealthDeepDiveBlockSchema = z.object({
  type: z.literal(TemplateBlockTypeSchema.enum.healthDeepDive),
  enabled: z.boolean(),
  template: TemplateMarkupSchema,
});

export const TemplateBlockSchema = z.discriminatedUnion('type', [
  TemplateCoverBlockSchema,
  TemplateSummaryBlockSchema,
  TemplateStoryBlockSchema,
  TemplateGoalsBlockSchema,
  TemplatePlanBlockSchema,
  TemplateOrdersBlockSchema,
  TemplateTimelineBlockSchema,
  TemplateCoachBlockSchema,
  TemplateHealthDeepDiveBlockSchema,
]);

export const TemplateDataSchema = z.object({
  blocks: z.array(TemplateBlockSchema).min(1),
});
