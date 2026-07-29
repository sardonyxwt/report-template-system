import { ZodType } from 'zod';
import { ID_PATH_PARAM_NAME } from '../constants';
import { ActionNumberIdParamsSchema } from '../data/common/common.data';
import {
  TemplateAggregateRequestSchema,
  TemplateAiEditEventSchema,
  TemplateAiEditRequestSchema,
  TemplateCreateRequestSchema,
  TemplatePreviewRequestSchema,
  TemplatePreviewResponseSchema,
  TemplateResponseSchema,
  TemplatesResponseSchema,
  TemplateUpdateRequestSchema,
} from '../data/template/template.data';
import { HttpMethod, HttpStatus } from '../enums';
import { ApiEndpoints } from '../types';

const root = 'template';

export const createTemplateEndpoints = (base = '') =>
  ({
    create: {
      method: HttpMethod.Post,
      path: `${base}/${root}`,
      status: HttpStatus.Created,
      body: TemplateCreateRequestSchema as ZodType,
      response: TemplateResponseSchema as ZodType,
      guards: ['auth'],
    },
    update: {
      method: HttpMethod.Put,
      path: `${base}/${root}`,
      body: TemplateUpdateRequestSchema as ZodType,
      response: TemplateResponseSchema as ZodType,
      guards: ['auth'],
    },
    preview: {
      method: HttpMethod.Post,
      path: `${base}/${root}/preview`,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/html; charset=utf-8',
      },
      body: TemplatePreviewRequestSchema as ZodType,
      response: TemplatePreviewResponseSchema as ZodType,
      guards: ['auth'],
    },
    aiEditStream: {
      method: HttpMethod.Post,
      events: true,
      path: `${base}/${root}/ai-edit/stream`,
      body: TemplateAiEditRequestSchema as ZodType,
      response: TemplateAiEditEventSchema as ZodType,
      guards: ['auth'],
    },
    delete: {
      method: HttpMethod.Delete,
      path: `${base}/${root}/:${ID_PATH_PARAM_NAME}`,
      build: (id: number) => `${base}/${root}/${id}`,
      params: ActionNumberIdParamsSchema as ZodType,
      response: TemplateResponseSchema as ZodType,
      guards: ['auth'],
    },
    findMany: {
      method: HttpMethod.Post,
      path: `${base}/${root}/select`,
      body: TemplateAggregateRequestSchema as ZodType,
      response: TemplatesResponseSchema as ZodType,
      guards: ['auth'],
    },
  }) satisfies ApiEndpoints;

export type TemplateEndpoints = ReturnType<typeof createTemplateEndpoints>;
