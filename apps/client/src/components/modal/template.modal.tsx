import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronDownIcon,
  EyeIcon,
  GripVerticalIcon,
  PencilIcon,
  SparklesIcon,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  type UseFormReturn,
} from 'react-hook-form';
import { toast } from 'sonner';
import {
  type ClinicResponse,
  REFERENCE_ITEMS_LIMIT,
  type TemplateAiEditRequest,
  type TemplateAiEditResponse,
  type TemplateCreateRequest,
  TemplateCreateRequestSchema,
  type TemplatePreviewRequest,
  type TemplateResponse,
  type TemplateUpdateRequest,
  TemplateUpdateRequestSchema,
} from 'platform/common-base';
import {
  TemplateBlockTypeSchema,
  type TemplateData,
  UserRole,
} from 'platform/prisma';
import { api } from '../../api/client.api';
import { type RequestStatus, useRequest } from '../../hooks/request.hook';
import { useAuthenticatedUser } from '../../providers/auth.provider';
import { getErrorMessage } from '../../utils/request.utils';
import { EntityAutocomplete } from '../form/entity-autocomplete.component';
import { FormFieldGroup } from '../form/form-field-group.component';
import { SubmitLabel } from '../form/submit-label.component';
import { TemplateAiEditor } from '../form/template-ai-editor.component';
import { cn } from '../shadcn/lib/utils';
import { Button } from '../shadcn/ui/button';
import { Checkbox } from '../shadcn/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../shadcn/ui/dialog';
import { Input } from '../shadcn/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../shadcn/ui/tabs';
import { Textarea } from '../shadcn/ui/textarea';

type TemplateForm = TemplateCreateRequest | TemplateUpdateRequest;
type TemplateBlock = TemplateData['blocks'][number];
type AiEditorScope = TemplateBlock['type'] | 'template';

export const TemplateModal = ({
  trigger,
  template,
  onSaved,
}: {
  trigger: ReactNode;
  template?: TemplateResponse;
  onSaved: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [previewHeight, setPreviewHeight] = useState(A4_HEIGHT_PX);
  const [aiContextIds, setAiContextIds] = useState<
    Partial<Record<AiEditorScope, string>>
  >({});
  const [activeAiScope, setActiveAiScope] = useState<AiEditorScope>();
  const [aiProgressMessage, setAiProgressMessage] = useState(
    'Sending your request…',
  );
  const aiSessionRef = useRef(0);
  const user = useAuthenticatedUser();
  const form = useForm<TemplateForm>({
    resolver: zodResolver(
      template ? TemplateUpdateRequestSchema : TemplateCreateRequestSchema,
    ),
    defaultValues: createDefaultValues(template),
  });
  const blocks = useFieldArray({
    control: form.control,
    name: 'data.blocks',
  });
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const clinicsRequest = useRequest(async () => {
    const response = await api.clinic.findMany({
      where: user.role === UserRole.Admin ? {} : { managerId: user.id },
      orderBy: { name: 'asc' },
      take: REFERENCE_ITEMS_LIMIT,
    });
    return response.items;
  });
  const saveRequest = useRequest(
    (data: TemplateForm) =>
      template
        ? api.template.update(data as TemplateUpdateRequest)
        : api.template.create(data as TemplateCreateRequest),
    {
      onSuccess: () => {
        toast.success(`Template ${template ? 'updated' : 'created'}.`);
        setOpen(false);
        onSaved();
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    },
  );
  const previewRequest = useRequest((data: TemplatePreviewRequest) =>
    api.template.preview(data),
  );
  const aiEditRequest = useRequest(
    async (
      body: TemplateAiEditRequest,
      session: number,
    ): Promise<TemplateAiEditResponse> => {
      for await (const event of api.template.editWithAi(body)) {
        if (event.type === 'progress') {
          if (session === aiSessionRef.current) {
            setAiProgressMessage(event.data.message);
          }
          continue;
        }

        if (event.type === 'error') {
          throw new Error(event.data.message);
        }

        return event.data;
      }

      throw new Error(
        'The AI progress stream ended before returning a result.',
      );
    },
  );

  useEffect(() => {
    aiSessionRef.current += 1;

    if (open) {
      setActiveTab('edit');
      setAiContextIds({});
      setActiveAiScope(undefined);
      setAiProgressMessage('Sending your request…');
      form.reset(createDefaultValues(template));
      void clinicsRequest.fetch().catch(() => undefined);
    }
  }, [clinicsRequest.fetch, form, open, template]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    const from = blocks.fields.findIndex(({ type }) => type === active.id);
    const to = blocks.fields.findIndex(({ type }) => type === over.id);

    if (from < 0 || to < 0) {
      return;
    }

    blocks.move(from, to);
  };

  const showPreview = () => {
    setActiveTab('preview');
    setPreviewHeight(A4_HEIGHT_PX);
    void previewRequest
      .fetch({ data: form.getValues('data') })
      .catch(() => undefined);
  };

  const editTemplateWithAi = async (
    prompt: string,
    blockType?: TemplateBlock['type'],
  ) => {
    const session = aiSessionRef.current;
    const scope: AiEditorScope = blockType ?? 'template';
    setActiveAiScope(scope);
    setAiProgressMessage('Sending your request…');

    const response = await aiEditRequest.fetch(
      {
        data: form.getValues('data'),
        prompt,
        ...(blockType ? { blockType } : {}),
        ...(aiContextIds[scope] ? { contextId: aiContextIds[scope] } : {}),
      },
      session,
    );

    if (session !== aiSessionRef.current) {
      return;
    }

    blocks.replace(response.data.blocks);
    form.setValue('data.blocks', response.data.blocks, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setAiContextIds((current) => ({
      ...current,
      [scope]: response.contextId,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit template' : 'Create template'}
          </DialogTitle>
          <DialogDescription>
            Configure, enable, and order every block in the report template.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="grid gap-5"
          onSubmit={form.handleSubmit(
            (data) => void saveRequest.fetch(data).catch(() => undefined),
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormFieldGroup
              label="Template name"
              htmlFor="template-name"
              error={form.formState.errors.name?.message}
            >
              <Input
                id="template-name"
                placeholder="Patient wellbeing report"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register('name')}
              />
            </FormFieldGroup>
            <FormFieldGroup
              label="Clinic"
              htmlFor="template-clinic"
              error={form.formState.errors.clinicId?.message}
            >
              <Controller
                control={form.control}
                name="clinicId"
                render={({ field }) => (
                  <EntityAutocomplete
                    id="template-clinic"
                    value={(clinicsRequest.data ?? []).find(
                      (clinic) => clinic.id === field.value,
                    )}
                    items={clinicsRequest.data ?? []}
                    placeholder="Search for a clinic…"
                    emptyLabel="No clinics found."
                    loading={clinicsRequest.isLoading}
                    invalid={Boolean(form.formState.errors.clinicId)}
                    getKey={(clinic: ClinicResponse) => String(clinic.id)}
                    getLabel={(clinic: ClinicResponse) => clinic.name}
                    onChange={(clinic) => field.onChange(clinic?.id ?? 0)}
                  />
                )}
              />
            </FormFieldGroup>
          </div>

          <div className="grid gap-3">
            <div>
              <h3 className="font-medium">Template blocks</h3>
              <p className="text-sm text-muted-foreground">
                Drag blocks to change their order. Handlebars-style markup is
                supported by the server template.
              </p>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                if (value === 'preview') {
                  showPreview();
                  return;
                }

                setActiveTab('edit');
              }}
            >
              <TabsList aria-label="Template mode">
                <TabsTrigger value="edit">
                  <PencilIcon />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <EyeIcon />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="grid gap-3">
                <div className="grid gap-2 rounded-xl border bg-muted/30 p-3">
                  <div>
                    <h4 className="flex items-center gap-2 font-medium">
                      <SparklesIcon className="size-4" />
                      Edit the complete template with AI
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      AI can update multiple blocks, enable or disable them, and
                      change their order.
                    </p>
                  </div>
                  <TemplateAiEditor
                    active={activeAiScope === 'template'}
                    busy={aiEditRequest.isLoading}
                    error={aiEditRequest.error}
                    loadingMessage={aiProgressMessage}
                    status={aiEditRequest.status}
                    successMessage="Template updated."
                    ariaLabel="Complete template AI instructions"
                    placeholder="Describe what you want AI to change across the template…"
                    onSubmit={(prompt) => editTemplateWithAi(prompt)}
                  />
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={blocks.fields.map(({ type }) => type)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid gap-2">
                      {blocks.fields.map((block, index) => (
                        <SortableTemplateBlock
                          key={block.id}
                          block={block}
                          form={form}
                          index={index}
                          aiActive={activeAiScope === block.type}
                          aiError={aiEditRequest.error}
                          aiLoading={aiEditRequest.isLoading}
                          aiProgressMessage={aiProgressMessage}
                          aiStatus={aiEditRequest.status}
                          onAiEdit={(prompt) =>
                            editTemplateWithAi(prompt, block.type)
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </TabsContent>

              <TabsContent
                value="preview"
                className="min-h-72 overflow-hidden rounded-xl border bg-muted/40"
              >
                <div className="min-h-72 overflow-x-auto p-4">
                  {previewRequest.isLoading && (
                    <p className="grid min-h-64 place-items-center p-8 text-sm text-muted-foreground">
                      Generating preview…
                    </p>
                  )}
                  {previewRequest.isError && (
                    <div className="mx-auto grid min-h-64 max-w-md place-content-center p-8 text-center">
                      <p className="font-medium">
                        Preview could not be generated
                      </p>
                      <p className="mt-1 text-sm text-destructive">
                        {getErrorMessage(previewRequest.error)}
                      </p>
                    </div>
                  )}
                  {previewRequest.data && !previewRequest.isLoading && (
                    <iframe
                      title="Template preview"
                      sandbox="allow-same-origin"
                      scrolling="no"
                      srcDoc={previewRequest.data}
                      style={{ height: previewHeight }}
                      className="mx-auto block w-[210mm] max-w-none shrink-0 bg-white shadow-lg"
                      onLoad={(event) => {
                        const document = event.currentTarget.contentDocument;
                        setPreviewHeight(
                          Math.max(
                            A4_HEIGHT_PX,
                            document?.documentElement.scrollHeight ?? 0,
                            document?.body.scrollHeight ?? 0,
                          ),
                        );
                      }}
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {form.formState.errors.data?.blocks?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.data.blocks.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveRequest.isLoading || aiEditRequest.isLoading}
            >
              <SubmitLabel loading={saveRequest.isLoading}>
                {template ? 'Save changes' : 'Create template'}
              </SubmitLabel>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SortableTemplateBlock = ({
  block,
  form,
  index,
  aiActive,
  aiError,
  aiLoading,
  aiProgressMessage,
  aiStatus,
  onAiEdit,
}: {
  block: TemplateBlock & { id: string };
  form: UseFormReturn<TemplateForm>;
  index: number;
  aiActive: boolean;
  aiError?: unknown;
  aiLoading: boolean;
  aiProgressMessage: string;
  aiStatus: RequestStatus;
  onAiEdit: (prompt: string) => Promise<void>;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [editorMode, setEditorMode] = useState<'manual' | 'ai'>('manual');
  const templateError =
    form.formState.errors.data?.blocks?.[index]?.template?.message;
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: block.type });

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
        transition,
      }}
      className={cn(
        'rounded-xl border bg-background transition-shadow',
        isDragging && 'relative z-10 opacity-70 shadow-lg',
      )}
    >
      <div className="flex min-h-12 items-center gap-2 px-3">
        <button
          type="button"
          aria-label={`Reorder ${formatBlockType(block.type)} block`}
          className="touch-none cursor-grab rounded-md p-1 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
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
          <span className="truncate">{formatBlockType(block.type)}</span>
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
        <div className="border-t p-3">
          <Tabs
            value={editorMode}
            onValueChange={(value) =>
              setEditorMode(value === 'ai' ? 'ai' : 'manual')
            }
          >
            <TabsList
              className="mb-1"
              aria-label={`${formatBlockType(block.type)} editing method`}
            >
              <TabsTrigger value="manual">
                <PencilIcon />
                Manual
              </TabsTrigger>
              <TabsTrigger value="ai">
                <SparklesIcon />
                AI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <Textarea
                rows={6}
                aria-label={`${formatBlockType(block.type)} template content`}
                aria-invalid={Boolean(
                  form.formState.errors.data?.blocks?.[index]?.template,
                )}
                placeholder="<section>{{content}}</section>"
                {...form.register(`data.blocks.${index}.template`)}
              />
              {templateError && (
                <p className="mt-2 text-sm text-destructive">{templateError}</p>
              )}
            </TabsContent>

            <TabsContent value="ai">
              <TemplateAiEditor
                active={aiActive}
                busy={aiLoading}
                error={aiError}
                loadingMessage={aiProgressMessage}
                status={aiStatus}
                successMessage={`${formatBlockType(block.type)} block updated.`}
                ariaLabel={`${formatBlockType(block.type)} AI instructions`}
                placeholder="Describe how you want AI to update this block…"
                onSubmit={onAiEdit}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

const createDefaultValues = (template?: TemplateResponse): TemplateForm =>
  template
    ? {
        id: template.id,
        clinicId: template.clinicId,
        name: template.name,
        data: normalizeTemplateData(template.data),
      }
    : {
        clinicId: 0,
        name: '',
        data: createDefaultTemplateData(),
      };

const createDefaultTemplateData = (): TemplateData => ({
  blocks: [
    {
      type: 'cover',
      enabled: true,
      template:
        '<header class="report-cover"><p>{{clinic}}</p><h1>{{title}}</h1><p>Assessment: {{assessmentDate}}<br>Generated: {{generatedAt}}</p><div class="people"><div><strong>Patient</strong><span style="margin-left: 8px">{{patient.name}}</span></div><div><strong>Prepared by</strong><span style="margin-left: 8px">{{preparedBy.name}}</span></div></div></header>',
    },
    {
      type: 'summary',
      enabled: true,
      template:
        '<section class="summary"><h2>Your Health Status</h2><blockquote style="margin-inline: 16px">{{content}}</blockquote>{{#if author}}<cite>— {{author}}</cite>{{/if}}</section>',
    },
    {
      type: 'story',
      enabled: true,
      template:
        '<section class="story"><h2>Your Story</h2><ul>{{#each items}}<li><strong>{{title}}:</strong> {{description}}</li>{{/each}}</ul></section>',
    },
    {
      type: 'goals',
      enabled: true,
      template:
        '<section class="goals"><h2>Your Goals</h2>{{#each goals}}<article><h3>{{title}}</h3><p>{{reason}} · {{timeframe}}</p><table><tbody>{{#each metrics}}<tr><td>{{name}}</td><td>{{currentValue}}</td><td>{{targetValue}}</td><td>{{timeframe}}</td></tr>{{/each}}</tbody></table></article>{{/each}}</section>',
    },
    {
      type: 'plan',
      enabled: true,
      template:
        '<section class="plan"><h2>Your Plan</h2><p>{{description}}</p>{{#each groups}}<h3>{{label}}</h3><ul>{{#each items}}<li>{{title}}</li>{{/each}}</ul>{{/each}}</section>',
    },
    {
      type: 'orders',
      enabled: true,
      template:
        '<section class="orders"><h2>Orders</h2><div class="columns">{{#each groups}}<div><h3>{{title}}</h3><ul>{{#each items}}<li>{{this}}</li>{{/each}}</ul></div>{{/each}}</div></section>',
    },
    {
      type: 'timeline',
      enabled: true,
      template:
        '<section class="timeline"><h2>Timeline & Follow-up</h2>{{#each groups}}<article><h3>{{#if label}}{{label}}{{else}}{{offset}} {{unit}}{{/if}}</h3><ul>{{#each items}}<li><strong>{{planItemTitle}}:</strong> {{milestone}}</li>{{/each}}</ul></article>{{/each}}</section>',
    },
    {
      type: 'coach',
      enabled: false,
      template:
        '<section class="coach"><h2>Your Coach</h2>{{#each items}}<article><h3>{{title}}</h3><h4>What to do</h4><p>{{whatToDo}}</p><h4>Why it matters</h4><p>{{whyItMatters}}</p><h4>Week 1 plan</h4><p>{{weekOnePlan}}</p></article>{{/each}}</section>',
    },
    {
      type: 'healthDeepDive',
      enabled: true,
      template:
        '<section class="health-deep-dive"><style>.health-deep-dive .status-label[data-status="atRisk"]::before{content:"at Risk"}.health-deep-dive .status-label[data-status="needsAttention"]::before{content:"needs Attention"}.health-deep-dive .status-label[data-status="optimal"]::before{content:"optimal"}</style><h2>Health Deep Dive</h2>{{#each domains}}<article data-status="{{status}}"><h3>{{title}} <span class="status-label" data-status="{{status}}"></span></h3><p>{{summary}}</p><table><tbody>{{#each biomarkers}}<tr><td>{{name}}</td><td>{{relevancy}}</td><td>{{value}}</td><td>{{referenceRange}}</td><td>{{optimalRange}}</td><td>{{measuredAt}}</td></tr>{{/each}}</tbody></table></article>{{/each}}</section>',
    },
  ],
});

const normalizeTemplateData = (data: TemplateData): TemplateData => {
  const defaults = createDefaultTemplateData();
  const blocksByType = new Map(data.blocks.map((block) => [block.type, block]));
  const orderedTypes = [
    ...data.blocks.map(({ type }) => type),
    ...TemplateBlockTypeSchema.options.filter(
      (type) => !blocksByType.has(type),
    ),
  ];
  const blocks = orderedTypes.map(
    (type) =>
      blocksByType.get(type) ??
      defaults.blocks.find((block) => block.type === type)!,
  );

  return {
    blocks,
  };
};

const formatBlockType = (value: string) =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase());

const A4_HEIGHT_PX = 1123;
