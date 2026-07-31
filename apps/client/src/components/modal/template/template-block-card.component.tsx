import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDownIcon,
  EyeIcon,
  GripVerticalIcon,
  PencilIcon,
  SparklesIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { formatLabel } from '../../../utils/formatting.utils';
import { TemplateAiEditor } from '../../form/template-ai-editor.component';
import { cn } from '../../shadcn/lib/utils';
import { Checkbox } from '../../shadcn/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shadcn/ui/tabs';
import { Textarea } from '../../shadcn/ui/textarea';
import { useTemplateAiGeneration } from './template-ai-generation.provider';
import { TemplateGenerationStatus } from './template-generation-status.component';
import { TemplatePreviewFrame } from './template-preview-frame.component';
import { type TemplateBlock, type TemplateForm } from './template.types';
import { PRESERVED_TAB_CONTENT_CLASS } from './template.utils';

export const TemplateBlockCard = ({
  block,
  form,
  index,
  isSorting,
}: {
  block: TemplateBlock & { id: string };
  form: UseFormReturn<TemplateForm>;
  index: number;
  /** While sorting, hide expanded bodies so items keep a uniform height. */
  isSorting: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [editorMode, setEditorMode] = useState<'manual' | 'ai' | 'preview'>(
    'manual',
  );
  const { canEditBlock, canGenerate, generate, getScopeState } =
    useTemplateAiGeneration();
  const editingLocked = !canEditBlock(block.type);
  const generationBusy = getScopeState(block.type).status === 'loading';
  const templateError =
    form.formState.errors.data?.blocks?.[index]?.template?.message;
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: block.type,
    disabled: editingLocked,
    animateLayoutChanges: () => false,
  });

  useEffect(() => {
    if (templateError) {
      setExpanded(true);
    }
  }, [templateError]);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isSorting ? undefined : transition,
      }}
      className={cn(
        'min-w-0 max-w-full rounded-xl border bg-background transition-shadow',
        isDragging && 'relative z-10 opacity-70 shadow-lg',
      )}
    >
      <div className="flex min-h-12 items-center gap-2 px-3">
        <button
          type="button"
          disabled={editingLocked}
          aria-label={`Reorder ${formatLabel(block.type)} block`}
          className="touch-none cursor-grab rounded-md p-1 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>

        <button
          type="button"
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2 self-stretch text-left font-medium outline-none"
          onClick={() => setExpanded((value) => !value)}
        >
          <span className="truncate">{formatLabel(block.type)}</span>
          <ChevronDownIcon
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </button>

        <Controller
          control={form.control}
          name={`data.blocks.${index}.enabled`}
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={field.value}
                disabled={editingLocked}
                onCheckedChange={field.onChange}
              />
              <span className="w-16 text-muted-foreground">
                {field.value ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          )}
        />
      </div>

      {expanded && (
        <div
          className={cn(
            'min-w-0 border-t p-3',
            // Keep mounted while sorting so editor state survives; hide for uniform row height.
            isSorting && 'hidden',
          )}
        >
          <Tabs
            className="min-w-0"
            value={editorMode}
            onValueChange={(value) =>
              setEditorMode(value as 'manual' | 'ai' | 'preview')
            }
          >
            <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
              <TabsList
                aria-label={`${formatLabel(block.type)} editing method`}
              >
                <TabsTrigger value="manual">
                  <PencilIcon />
                  Manual
                </TabsTrigger>
                <TabsTrigger value="ai">
                  <SparklesIcon />
                  AI
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <EyeIcon />
                  Preview
                </TabsTrigger>
              </TabsList>
              <TemplateGenerationStatus
                scope={block.type}
                className="min-w-0 flex-1"
              />
            </div>

            <TabsContent
              value="manual"
              forceMount
              className={PRESERVED_TAB_CONTENT_CLASS}
            >
              <Textarea
                rows={6}
                aria-label={`${formatLabel(block.type)} template content`}
                aria-invalid={Boolean(
                  form.formState.errors.data?.blocks?.[index]?.template,
                )}
                placeholder="<section>{{content}}</section>"
                {...form.register(`data.blocks.${index}.template`)}
                disabled={editingLocked}
              />
              {templateError && (
                <p className="mt-2 text-sm text-destructive">{templateError}</p>
              )}
            </TabsContent>

            <TabsContent
              value="ai"
              forceMount
              className={PRESERVED_TAB_CONTENT_CLASS}
            >
              <TemplateAiEditor
                busy={generationBusy}
                disabled={!canGenerate(block.type)}
                ariaLabel={`${formatLabel(block.type)} AI instructions`}
                placeholder="Describe how you want AI to update this block…"
                onSubmit={(params) => generate(block.type, params)}
              />
            </TabsContent>

            <TabsContent
              value="preview"
              forceMount
              className={cn('min-w-0 max-w-full', PRESERVED_TAB_CONTENT_CLASS)}
            >
              <TemplatePreviewFrame
                active={editorMode === 'preview'}
                getData={() => form.getValues('data')}
                blockType={block.type}
                title={`${formatLabel(block.type)} block preview`}
                loadingLabel="Generating block preview…"
                errorTitle="Block preview could not be generated"
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};
