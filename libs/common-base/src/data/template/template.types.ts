import { z } from 'zod';
import {
  TemplateAggregateRequestSchema,
  TemplateCreateRequestSchema,
  TemplateResponseSchema,
  TemplatesResponseSchema,
  TemplateUpdateRequestSchema,
} from './template.data';

export type TemplateResponse = z.infer<typeof TemplateResponseSchema>;
export type TemplatesResponse = z.infer<typeof TemplatesResponseSchema>;
export type TemplateCreateRequest = z.infer<typeof TemplateCreateRequestSchema>;
export type TemplateUpdateRequest = z.infer<typeof TemplateUpdateRequestSchema>;
export type TemplateAggregateRequest = z.infer<
  typeof TemplateAggregateRequestSchema
>;
