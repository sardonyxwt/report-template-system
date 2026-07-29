import { ChevronDownIcon, GaugeIcon, ImageIcon, SendIcon } from 'lucide-react';
import { useState } from 'react';
import {
  type TemplateAiReasoningEffort,
  TemplateAiReasoningEffortSchema,
} from 'platform/common-base';
import { AI_REASONING_EFFORT_OPTIONS } from '../../constants';
import { type RequestStatus } from '../../hooks/request.hook';
import { getErrorMessage } from '../../utils/request.utils';
import { cn } from '../shadcn/lib/utils';
import { Button } from '../shadcn/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../shadcn/ui/dropdown-menu';
import { Textarea } from '../shadcn/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '../shadcn/ui/tooltip';
import { RequestStatusNotification } from './request-status-notification.component';

/**
 * Reusable prompt, progress, and submit UI for template AI editing.
 *
 * The parent supplies the editing scope and applies the returned template data.
 */
export const TemplateAiEditor = ({
  active,
  busy,
  error,
  loadingMessage,
  placeholder,
  status,
  successMessage,
  ariaLabel,
  onSubmit,
}: {
  active: boolean;
  busy: boolean;
  error?: unknown;
  loadingMessage: string;
  placeholder: string;
  status: RequestStatus;
  successMessage: string;
  ariaLabel: string;
  onSubmit: (
    prompt: string,
    reasoningEffort: TemplateAiReasoningEffort,
    visualValidation: boolean,
  ) => Promise<void>;
}) => {
  const [prompt, setPrompt] = useState('');
  const [reasoningEffort, setReasoningEffort] =
    useState<TemplateAiReasoningEffort>('low');
  const [visualValidation, setVisualValidation] = useState(false);
  const editorStatus = active ? status : 'initial';
  const reasoningEffortOption = AI_REASONING_EFFORT_OPTIONS.find(
    ({ value }) => value === reasoningEffort,
  );

  return (
    <div className="grid gap-2">
      <Textarea
        rows={4}
        value={prompt}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(event) => setPrompt(event.target.value)}
      />
      <div className="flex items-stretch justify-between gap-3">
        <RequestStatusNotification
          status={editorStatus}
          loadingMessage={loadingMessage}
          successMessage={successMessage}
          errorMessage={
            active && error !== undefined ? getErrorMessage(error) : undefined
          }
          className="flex-1"
        />
        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                aria-label="AI reasoning effort"
                title="AI reasoning effort"
                className="min-w-40 justify-start"
              >
                <GaugeIcon className="text-muted-foreground" />
                <span className="text-muted-foreground">Effort</span>
                <span
                  className={cn(
                    'size-2 rounded-full',
                    reasoningEffortOption?.dotClassName,
                  )}
                />
                <span>{reasoningEffortOption?.label}</span>
                <ChevronDownIcon className="ml-auto text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuLabel>Reasoning effort</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={reasoningEffort}
                onValueChange={(value) =>
                  setReasoningEffort(
                    TemplateAiReasoningEffortSchema.parse(value),
                  )
                }
              >
                {AI_REASONING_EFFORT_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                  >
                    <span
                      className={cn('size-2 rounded-full', option.dotClassName)}
                    />
                    <span>{option.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={busy}
                aria-label="Toggle PNG visual validation"
                aria-pressed={visualValidation}
                className={cn(
                  'text-muted-foreground',
                  visualValidation &&
                    'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300',
                )}
                onClick={() => setVisualValidation((enabled) => !enabled)}
              >
                <ImageIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {visualValidation
                ? 'PNG visual validation is enabled. AI may inspect rendered previews for layout issues.'
                : 'Enable PNG visual validation for layout, clipping, and pagination checks. This may take longer.'}
            </TooltipContent>
          </Tooltip>
          <Button
            type="button"
            className="shrink-0"
            disabled={!prompt.trim() || busy}
            onClick={() => {
              void onSubmit(prompt, reasoningEffort, visualValidation)
                .then(() => setPrompt(''))
                .catch(() => undefined);
            }}
          >
            <SendIcon />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
