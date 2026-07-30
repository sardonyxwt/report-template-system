import { type TemplateAiReasoningEffort } from 'platform/common-base';

export const SEARCH_DEBOUNCE_DELAY_MS = 300;
export const REQUEST_LONG_LOADING_MS = 300;
export const REQUEST_SUCCESS_VISIBILITY_MS = 1_500;

export const DEFAULT_ERROR_MESSAGE = 'Something went wrong.';

export const A4_PAGE_HEIGHT_PX = 1123;
export const TEMPLATE_BLOCK_PREVIEW_FALLBACK_HEIGHT_PX = 256;
export const TEMPLATE_BLOCK_PREVIEW_BOTTOM_PADDING_PX = 24;

export const AI_REASONING_EFFORT_OPTIONS = [
  {
    value: 'low',
    label: 'Low',
    description: 'Faster',
    dotClassName: 'bg-emerald-500',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Balanced',
    dotClassName: 'bg-amber-500',
  },
  {
    value: 'high',
    label: 'High',
    description: 'More thorough',
    dotClassName: 'bg-rose-500',
  },
] satisfies {
  value: TemplateAiReasoningEffort;
  label: string;
  description: string;
  dotClassName: string;
}[];
