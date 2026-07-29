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

type TemplateAiSubmitParams = {
  prompt: string;
  model: string;
  reasoningEffort: TemplateAiReasoningEffort;
  visualValidation: boolean;
  speed: boolean;
};

/**
 * Prompt + model controls for template AI editing.
 * Generation progress lives next to the parent tabs via generationState.
 */
export const TemplateAiEditor = ({
  busy,
  disabled = false,
  placeholder,
  ariaLabel,
  onSubmit,
}: {
  busy: boolean;
  disabled?: boolean;
  placeholder: string;
  ariaLabel: string;
  onSubmit: (params: TemplateAiSubmitParams) => Promise<void>;
}) => {
  const models = clientEnvironment.openAiModelAllowlist;
  const [prompt, setPrompt] = useState('');
  const [modelId, setModelId] = useState(models[0]!);
  const [reasoningEffort, setReasoningEffort] =
    useState<TemplateAiReasoningEffort>('low');
  const [speed, setSpeed] = useState(false);
  const [visualValidation, setVisualValidation] = useState(false);
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
        disabled={busy}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(event) => setPrompt(event.target.value)}
      />
      <div className="flex min-w-0 flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
        <Select
          value={modelId}
          disabled={busy || disabled}
          onValueChange={setModelId}
        >
          <SelectTrigger
            aria-label="AI model"
            className="h-auto min-w-0 max-w-full justify-start md:w-auto md:max-w-xs md:flex-none"
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
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:w-auto md:shrink-0 md:justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={busy || disabled}
                aria-label="AI reasoning effort"
                title="AI reasoning effort"
                className="w-auto shrink-0 justify-start"
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
                disabled={busy || disabled}
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
                disabled={busy || disabled}
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
            disabled={!prompt.trim() || !modelId || busy || disabled}
            onClick={() => {
              const submittedPrompt = prompt;
              void onSubmit({
                prompt: submittedPrompt,
                model: modelId,
                reasoningEffort,
                visualValidation,
                speed,
              })
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
