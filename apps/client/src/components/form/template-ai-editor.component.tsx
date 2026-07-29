import {
  BotIcon,
  ChevronDownIcon,
  GaugeIcon,
  ImageIcon,
  SendIcon,
  ZapIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  type TemplateAiReasoningEffort,
  TemplateAiReasoningEffortSchema,
} from 'platform/common-base';
import { AI_REASONING_EFFORT_OPTIONS } from '../../constants';
import { clientEnvironment } from '../../env/client.env';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../shadcn/ui/select';
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
    model: string,
    reasoningEffort: TemplateAiReasoningEffort,
    visualValidation: boolean,
    speed: boolean,
  ) => Promise<void>;
}) => {
  const models = clientEnvironment.openAiModelAllowlist;
  const [prompt, setPrompt] = useState('');
  const [modelId, setModelId] = useState(models[0]!);
  const [reasoningEffort, setReasoningEffort] =
    useState<TemplateAiReasoningEffort>('low');
  const [speed, setSpeed] = useState(false);
  const [visualValidation, setVisualValidation] = useState(false);
  const editorStatus = active ? status : 'initial';
  const reasoningEffortOption = AI_REASONING_EFFORT_OPTIONS.find(
    ({ value }) => value === reasoningEffort,
  );

  useEffect(() => {
    setModelId((current) => (models.includes(current) ? current : models[0]!));
  }, [models]);

  return (
    <div className="grid gap-2">
      <Textarea
        rows={4}
        value={prompt}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(event) => setPrompt(event.target.value)}
      />
      <div className="flex min-w-0 flex-col items-stretch gap-2 md:flex-row md:justify-between md:gap-3">
        <div className="flex min-w-0 flex-col items-stretch gap-2 md:flex-row">
          <Select value={modelId} disabled={busy} onValueChange={setModelId}>
            <SelectTrigger
              aria-label="AI model"
              className="h-auto min-w-0 max-w-full justify-start md:flex-none"
            >
              <BotIcon className="text-muted-foreground" />
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent align="start" className="max-w-[calc(100vw-2rem)]">
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RequestStatusNotification
            status={editorStatus}
            loadingMessage={loadingMessage}
            successMessage={successMessage}
            errorMessage={
              active && error !== undefined ? getErrorMessage(error) : undefined
            }
            className="min-w-0 max-w-full md:flex-none"
          />
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:w-auto md:shrink-0 md:justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                aria-label="AI reasoning effort"
                title="AI reasoning effort"
                className="min-w-36 flex-1 justify-start md:min-w-40 md:flex-none"
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={busy}
                aria-label="Toggle AI Speed"
                aria-pressed={speed}
                className={cn(
                  'text-muted-foreground',
                  speed &&
                    'border-amber-500/50 bg-amber-500/10 text-amber-600 hover:bg-amber-500/15 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300',
                )}
                onClick={() => setSpeed((enabled) => !enabled)}
              >
                <ZapIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {speed
                ? 'Speed is enabled. AI requests use Priority processing, which is billed at a premium.'
                : 'Enable Speed to use lower-latency Priority processing. This is billed at a premium.'}
            </TooltipContent>
          </Tooltip>
          <Button
            type="button"
            className="shrink-0"
            disabled={!prompt.trim() || !modelId || busy}
            onClick={() => {
              try {
                void onSubmit(
                  prompt,
                  modelId,
                  reasoningEffort,
                  visualValidation,
                  speed,
                );
                setPrompt('');
              } catch {
                // ignore
              }
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
