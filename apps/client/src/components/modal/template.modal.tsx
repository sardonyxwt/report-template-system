import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import {
  type ClinicResponse,
  type TemplateCreateRequest,
  TemplateCreateRequestSchema,
  type TemplateResponse,
  type TemplateUpdateRequest,
  TemplateUpdateRequestSchema,
} from 'platform/common-base';
import {
  TemplateBlockTypeSchema,
  type TemplateData,
  UserRole,
} from 'platform/prisma';
import { type ReactNode, useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { api } from '../../api/client.api';
import { useRequest } from '../../hooks/request.hook';
import { useAuthenticatedUser } from '../../providers/auth.provider';
import { getErrorMessage } from '../../utils/request.utils';
import { FormFieldGroup } from '../form/form-field-group.component';
import { SubmitLabel } from '../form/submit-label.component';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../shadcn/ui/select';
import { Textarea } from '../shadcn/ui/textarea';

type TemplateForm = TemplateCreateRequest | TemplateUpdateRequest;
type TemplateBlock = TemplateData['blocks'][number];

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
      take: 100,
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

  useEffect(() => {
    if (open) {
      form.reset(createDefaultValues(template));
      void clinicsRequest.fetch().catch(() => undefined);
    }
  }, [clinicsRequest.fetch, form, open, template]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit template' : 'Create template'}
          </DialogTitle>
          <DialogDescription>
            Define ordered report blocks. Each block type can appear only once.
          </DialogDescription>
        </DialogHeader>
        <form
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
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger id="template-clinic" className="w-full">
                      <SelectValue placeholder="Select clinic" />
                    </SelectTrigger>
                    <SelectContent>
                      {(clinicsRequest.data ?? []).map(
                        (clinic: ClinicResponse) => (
                          <SelectItem key={clinic.id} value={String(clinic.id)}>
                            {clinic.name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormFieldGroup>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Template blocks</h3>
                <p className="text-sm text-muted-foreground">
                  Handlebars-style markup is supported by the server template.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => blocks.append(createBlock('summary'))}
              >
                <PlusIcon />
                Add block
              </Button>
            </div>
            {blocks.fields.map((block, index) => (
              <div
                key={block.id}
                className="grid gap-3 rounded-xl border bg-muted/25 p-4"
              >
                <div className="flex items-start gap-3">
                  <Controller
                    control={form.control}
                    name={`data.blocks.${index}.type`}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TemplateBlockTypeSchema.options.map((type) => (
                            <SelectItem key={type} value={type}>
                              {formatBlockType(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name={`data.blocks.${index}.enabled`}
                    render={({ field }) => (
                      <label className="flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        Enabled
                      </label>
                    )}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Remove template block"
                    disabled={blocks.fields.length === 1}
                    onClick={() => blocks.remove(index)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
                <Textarea
                  rows={4}
                  placeholder="<section>{{content}}</section>"
                  {...form.register(`data.blocks.${index}.template`)}
                />
                {form.formState.errors.data?.blocks?.[index]?.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.data.blocks[index]?.message}
                  </p>
                )}
              </div>
            ))}
            {form.formState.errors.data?.blocks?.root?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.data.blocks.root.message}
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
            <Button type="submit" disabled={saveRequest.isLoading}>
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

const createDefaultValues = (template?: TemplateResponse): TemplateForm =>
  template
    ? {
        id: template.id,
        clinicId: template.clinicId,
        name: template.name,
        data: template.data,
      }
    : {
        clinicId: 0,
        name: '',
        data: {
          blocks: [createBlock('summary')],
        },
      };

const createBlock = (type: TemplateBlock['type']): TemplateBlock =>
  ({
    type,
    enabled: true,
    template: '<section>{{content}}</section>',
  }) as TemplateBlock;

const formatBlockType = (value: string) =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase());
