import { z } from 'zod';
import { TemplateSimpleSchema } from './template-simple.data';
import {
  TemplateAggregateRequestSchema,
  TemplateAiEditEventSchema,
  TemplateAiEditProgressEventSchema,
  TemplateAiReasoningEffortSchema,
  TemplateAiEditRequestSchema,
  TemplateAiEditResponseSchema,
  TemplateCreateRequestSchema,
  TemplatePreviewRequestSchema,
  TemplatePreviewResponseSchema,
  TemplateResponseSchema,
  TemplatesResponseSchema,
  TemplateUpdateRequestSchema,
} from './template.data';

export type TemplateSimple = z.infer<typeof TemplateSimpleSchema>;
export type TemplateResponse = z.infer<typeof TemplateResponseSchema>;
export type TemplatesResponse = z.infer<typeof TemplatesResponseSchema>;
export type TemplateCreateRequest = z.infer<typeof TemplateCreateRequestSchema>;
export type TemplateUpdateRequest = z.infer<typeof TemplateUpdateRequestSchema>;
export type TemplatePreviewRequest = z.infer<
  typeof TemplatePreviewRequestSchema
>;
export type TemplatePreviewResponse = z.infer<
  typeof TemplatePreviewResponseSchema
>;
export type TemplateAiReasoningEffort = z.infer<
  typeof TemplateAiReasoningEffortSchema
>;
export type TemplateAiEditRequest = z.infer<typeof TemplateAiEditRequestSchema>;
export type TemplateAiEditResponse = z.infer<
  typeof TemplateAiEditResponseSchema
>;
export type TemplateAiEditProgressEvent = z.infer<
  typeof TemplateAiEditProgressEventSchema
>;
export type TemplateAiEditEvent = z.infer<typeof TemplateAiEditEventSchema>;
export type TemplateAggregateRequest = z.infer<
  typeof TemplateAggregateRequestSchema
>;
