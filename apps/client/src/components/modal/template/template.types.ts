import {
  type TemplateAiReasoningEffort,
  type TemplateCreateRequest,
  type TemplateUpdateRequest,
} from 'platform/common-base';
import { type TemplateBlockType, type TemplateData } from 'platform/prisma';
import { type RequestStatus } from '../../../hooks/request.hook';

export type TemplateForm = TemplateCreateRequest | TemplateUpdateRequest;
export type TemplateBlock = TemplateData['blocks'][number];
export type AiGenerationScope = TemplateBlockType | 'template';

export type ScopeGenerationState = {
  status: RequestStatus;
  progressMessage: string;
  error?: unknown;
};

export type GenerationState = Partial<
  Record<AiGenerationScope, ScopeGenerationState>
>;

export type AiEditorContext = {
  id: string;
  model: string;
};

export type TemplateAiSubmitParams = {
  prompt: string;
  model: string;
  reasoningEffort: TemplateAiReasoningEffort;
  visualValidation: boolean;
  speed: boolean;
};

export const IDLE_GENERATION_STATE: ScopeGenerationState = {
  status: 'initial',
  progressMessage: 'Sending your request…',
};
