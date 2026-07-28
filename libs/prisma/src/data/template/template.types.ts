import { z } from 'zod';
import {
  TemplateBlockSchema,
  TemplateBlockTypeSchema,
  TemplateCoachBlockSchema,
  TemplateCoverBlockSchema,
  TemplateDataSchema,
  TemplateGoalsBlockSchema,
  TemplateHealthDeepDiveBlockSchema,
  TemplateMarkupSchema,
  TemplateOrdersBlockSchema,
  TemplatePlanBlockSchema,
  TemplateStoryBlockSchema,
  TemplateSummaryBlockSchema,
  TemplateTimelineBlockSchema,
} from './template.data';

export type TemplateBlockType = z.infer<typeof TemplateBlockTypeSchema>;
export type TemplateMarkup = z.infer<typeof TemplateMarkupSchema>;
export type TemplateCoverBlock = z.infer<typeof TemplateCoverBlockSchema>;
export type TemplateSummaryBlock = z.infer<typeof TemplateSummaryBlockSchema>;
export type TemplateStoryBlock = z.infer<typeof TemplateStoryBlockSchema>;
export type TemplateGoalsBlock = z.infer<typeof TemplateGoalsBlockSchema>;
export type TemplatePlanBlock = z.infer<typeof TemplatePlanBlockSchema>;
export type TemplateOrdersBlock = z.infer<typeof TemplateOrdersBlockSchema>;
export type TemplateTimelineBlock = z.infer<typeof TemplateTimelineBlockSchema>;
export type TemplateCoachBlock = z.infer<typeof TemplateCoachBlockSchema>;
export type TemplateHealthDeepDiveBlock = z.infer<
  typeof TemplateHealthDeepDiveBlockSchema
>;
export type TemplateBlock = z.infer<typeof TemplateBlockSchema>;
export type TemplateData = z.infer<typeof TemplateDataSchema>;
