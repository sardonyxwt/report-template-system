import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, PencilIcon } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import {
  useFieldArray,
  useForm,
  type UseFieldArrayReturn,
  type UseFormReturn,
} from 'react-hook-form';
import { toast } from 'sonner';
import {
  type ClinicResponse,
  REFERENCE_ITEMS_LIMIT,
  type TemplateCreateRequest,
  TemplateCreateRequestSchema,
  type TemplateResponse,
  type TemplateUpdateRequest,
  TemplateUpdateRequestSchema,
} from 'platform/common-base';
import { type TemplateData, UserRole } from 'platform/prisma';
import { api } from '../../api/client.api';
import { useRequest } from '../../hooks/request.hook';
import { useAuthenticatedUser } from '../../providers/auth.provider';
import { getErrorMessage } from '../../utils/request.utils';
import { cn } from '../shadcn/lib/utils';
import { Button } from '../shadcn/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../shadcn/ui/dialog';
import { Spinner } from '../shadcn/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../shadcn/ui/tabs';
import {
  TemplateAiGenerationProvider,
  useTemplateAiGeneration,
} from './template/template-ai-generation.provider';
import { TemplateAiPanel } from './template/template-ai-panel.component';
import { TemplateBlocksList } from './template/template-blocks-list.component';
import { TemplateGenerationStatus } from './template/template-generation-status.component';
import { TemplateMetaFields } from './template/template-meta-fields.component';
import { TemplatePreviewFrame } from './template/template-preview-frame.component';
import {
  type AiGenerationScope,
  type TemplateForm,
} from './template/template.types';
import {
  createDefaultValues,
  PRESERVED_TAB_CONTENT_CLASS,
} from './template/template.utils';

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

  const getTemplateData = useCallback(() => form.getValues('data'), [form]);

  const applyAiResult = useCallback(
    (scope: AiGenerationScope, data: TemplateData) => {
      if (scope === 'template') {
        blocks.replace(data.blocks);
        form.setValue('data.blocks', data.blocks, {
          shouldDirty: true,
          shouldValidate: true,
        });
        return;
      }

      // Merge only the edited block so concurrent generations do not clobber each other.
      const updatedBlock = data.blocks.find((block) => block.type === scope);
      if (!updatedBlock) {
        return;
      }

      const nextBlocks = form
        .getValues('data.blocks')
        .map((block) => (block.type === scope ? updatedBlock : block));

      blocks.replace(nextBlocks);
      form.setValue('data.blocks', nextBlocks, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [blocks, form],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-x-hidden overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit template' : 'Create template'}
          </DialogTitle>
          <DialogDescription>
            Configure, enable, and order every block in the report template.
          </DialogDescription>
        </DialogHeader>

        <TemplateAiGenerationProvider
          getTemplateData={getTemplateData}
          applyResult={applyAiResult}
        >
          <TemplateModalForm
            open={open}
            template={template}
            form={form}
            blocks={blocks}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            clinics={clinicsRequest.data ?? []}
            clinicsLoading={clinicsRequest.isLoading}
            loadClinics={clinicsRequest.fetch}
            saving={saveRequest.isLoading}
            onCancel={() => setOpen(false)}
            onSave={(data) =>
              void saveRequest.fetch(data).catch(() => undefined)
            }
          />
        </TemplateAiGenerationProvider>
      </DialogContent>
    </Dialog>
  );
};

const TemplateModalForm = ({
  open,
  template,
  form,
  blocks,
  activeTab,
  setActiveTab,
  clinics,
  clinicsLoading,
  loadClinics,
  saving,
  onCancel,
  onSave,
}: {
  open: boolean;
  template?: TemplateResponse;
  form: UseFormReturn<TemplateForm>;
  blocks: UseFieldArrayReturn<TemplateForm, 'data.blocks'>;
  activeTab: 'edit' | 'preview';
  setActiveTab: (tab: 'edit' | 'preview') => void;
  clinics: ClinicResponse[];
  clinicsLoading: boolean;
  loadClinics: () => Promise<ClinicResponse[]>;
  saving: boolean;
  onCancel: () => void;
  onSave: (data: TemplateForm) => void;
}) => {
  const { isAnyGenerating, reset } = useTemplateAiGeneration();

  useEffect(() => {
    // Invalidate in-flight AI streams whenever the dialog opens or closes.
    reset();

    if (!open) {
      return;
    }

    setActiveTab('edit');
    form.reset(createDefaultValues(template));
    void loadClinics().catch(() => undefined);
  }, [form, loadClinics, open, reset, setActiveTab, template]);

  return (
    <form
      noValidate
      className="grid min-w-0 gap-5"
      onSubmit={form.handleSubmit(onSave)}
    >
      <TemplateMetaFields
        form={form}
        clinics={clinics}
        clinicsLoading={clinicsLoading}
      />

      <div className="grid min-w-0 gap-3">
        <div>
          <h3 className="font-medium">Template blocks</h3>
          <p className="text-sm text-muted-foreground">
            Drag blocks to change their order. Handlebars-style markup is
            supported by the server template.
          </p>
        </div>

        <Tabs
          className="min-w-0"
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value === 'preview' ? 'preview' : 'edit')
          }
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
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
            <TemplateGenerationStatus
              scope="template"
              className="min-w-0 flex-1"
            />
          </div>

          <TabsContent
            value="edit"
            forceMount
            className={cn('grid min-w-0 gap-3', PRESERVED_TAB_CONTENT_CLASS)}
          >
            <TemplateAiPanel />
            <TemplateBlocksList form={form} blocks={blocks} />
          </TabsContent>

          <TabsContent
            value="preview"
            forceMount
            className={PRESERVED_TAB_CONTENT_CLASS}
          >
            <TemplatePreviewFrame
              active={activeTab === 'preview'}
              getData={() => form.getValues('data')}
              title="Template preview"
              loadingLabel="Generating preview…"
              errorTitle="Preview could not be generated"
              fullPage
            />
          </TabsContent>
        </Tabs>

        {form.formState.errors.data?.blocks?.message && (
          <p className="text-sm text-destructive">
            {form.formState.errors.data.blocks.message}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || isAnyGenerating}>
          {saving && <Spinner data-icon="inline-start" />}
          {template ? 'Save changes' : 'Create template'}
        </Button>
      </DialogFooter>
    </form>
  );
};
