import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  type ClinicCreateRequest,
  ClinicCreateRequestSchema,
  type ClinicResponse,
  type ClinicUpdateRequest,
  ClinicUpdateRequestSchema,
  REFERENCE_ITEMS_LIMIT,
} from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { api } from '../../api/client.api';
import { useRequest } from '../../hooks/request.hook';
import { useAccessControl } from '../../providers/access-control.provider';
import { useAuthenticatedUser } from '../../providers/auth.provider';
import { formatOptionLabel } from '../../utils/formatting.utils';
import { getErrorMessage } from '../../utils/request.utils';
import { EntityAutocomplete } from '../form/entity-autocomplete.component';
import {
  FormDialog,
  useDialogReset,
  useFormDialog,
} from '../form/form-dialog.component';
import { Field, FieldError, FieldLabel } from '../shadcn/ui/field';
import { Input } from '../shadcn/ui/input';

type ClinicForm = ClinicCreateRequest | ClinicUpdateRequest;

const createDefaultValues = (
  clinic?: ClinicResponse,
  managerId?: number,
): ClinicForm =>
  clinic
    ? {
        id: clinic.id,
        managerId: clinic.managerId,
        name: clinic.name,
      }
    : {
        managerId: managerId ?? 0,
        name: '',
      };

export const ClinicModal = ({
  trigger,
  clinic,
  onSaved,
}: {
  trigger: ReactNode;
  clinic?: ClinicResponse;
  onSaved: () => void;
}) => {
  const user = useAuthenticatedUser();
  const access = useAccessControl();
  const canAssignManager = access.managers.create();
  const { open, setOpen, closeAndSave } = useFormDialog({ onSaved });
  const form = useForm<ClinicForm>({
    resolver: zodResolver(
      clinic ? ClinicUpdateRequestSchema : ClinicCreateRequestSchema,
    ),
    defaultValues: createDefaultValues(
      clinic,
      canAssignManager ? undefined : user.id,
    ),
  });
  const managersRequest = useRequest(async () => {
    const response = await api.user.findMany({
      where: { role: UserRole.Manager },
      orderBy: { email: 'asc' },
      take: REFERENCE_ITEMS_LIMIT,
    });
    return response.items;
  });
  const saveRequest = useRequest(
    (data: ClinicForm) =>
      clinic
        ? api.clinic.update(data as ClinicUpdateRequest)
        : api.clinic.create(data as ClinicCreateRequest),
    {
      onSuccess: () => {
        toast.success(`Clinic ${clinic ? 'updated' : 'created'}.`);
        closeAndSave();
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    },
  );

  useDialogReset({
    open,
    reset: form.reset,
    getValues: () =>
      createDefaultValues(clinic, canAssignManager ? undefined : user.id),
    onOpen: () => {
      if (canAssignManager) {
        void managersRequest.fetch();
      }
    },
  });

  return (
    <FormDialog
      trigger={trigger}
      title={clinic ? 'Edit clinic' : 'Create clinic'}
      description="Managers automatically own clinics they create. Administrators can assign a manager."
      submitLabel={clinic ? 'Save changes' : 'Create clinic'}
      loading={saveRequest.isLoading}
      open={open}
      onOpenChange={setOpen}
      form={form}
      onSubmit={(data) => void saveRequest.fetch(data)}
    >
      <Field data-invalid={Boolean(form.formState.errors.name)}>
        <FieldLabel htmlFor="clinic-name">Clinic name</FieldLabel>
        <Input
          id="clinic-name"
          placeholder="Northstar Health"
          aria-invalid={Boolean(form.formState.errors.name)}
          {...form.register('name')}
        />
        <FieldError errors={[form.formState.errors.name]} />
      </Field>
      {canAssignManager && (
        <Field data-invalid={Boolean(form.formState.errors.managerId)}>
          <FieldLabel htmlFor="clinic-manager">Manager</FieldLabel>
          <Controller
            control={form.control}
            name="managerId"
            render={({ field }) => (
              <EntityAutocomplete
                id="clinic-manager"
                value={(managersRequest.data ?? []).find(
                  (manager) => manager.id === field.value,
                )}
                items={managersRequest.data ?? []}
                placeholder="Search for a manager…"
                emptyLabel="No managers found."
                loading={managersRequest.isLoading}
                invalid={Boolean(form.formState.errors.managerId)}
                getKey={(manager) => String(manager.id)}
                getLabel={(manager) =>
                  formatOptionLabel(manager.fullName, manager.email)
                }
                onChange={(manager) => field.onChange(manager?.id ?? 0)}
              />
            )}
          />
          <FieldError errors={[form.formState.errors.managerId]} />
        </Field>
      )}
    </FormDialog>
  );
};
