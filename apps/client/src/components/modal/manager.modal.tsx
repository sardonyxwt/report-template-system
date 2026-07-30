import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  type ManagerCreateRequest,
  ManagerCreateRequestSchema,
  REFERENCE_ITEMS_LIMIT,
  type UserResponse,
} from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { api } from '../../api/client.api';
import { useRequest } from '../../hooks/request.hook';
import { formatOptionLabel } from '../../utils/formatting.utils';
import { getErrorMessage } from '../../utils/request.utils';
import { EntityAutocomplete } from '../form/entity-autocomplete.component';
import {
  FormDialog,
  useDialogReset,
  useFormDialog,
} from '../form/form-dialog.component';
import { Field, FieldError, FieldLabel } from '../shadcn/ui/field';

export const ManagerModal = ({
  trigger,
  onSaved,
}: {
  trigger: ReactNode;
  onSaved: () => void;
}) => {
  const { open, setOpen, closeAndSave } = useFormDialog({ onSaved });
  const form = useForm<ManagerCreateRequest>({
    resolver: zodResolver(ManagerCreateRequestSchema),
    defaultValues: { userId: 0 },
  });
  const usersRequest = useRequest(async () => {
    const response = await api.user.findMany({
      where: {
        role: UserRole.User,
        manager: null,
        patient: null,
      },
      orderBy: { email: 'asc' },
      take: REFERENCE_ITEMS_LIMIT,
    });
    return response.items;
  });
  const createRequest = useRequest(api.manager.create, {
    onSuccess: () => {
      toast.success('Manager created.');
      closeAndSave();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  useDialogReset({
    open,
    reset: form.reset,
    getResetValues: () => ({ userId: 0 }),
    onOpen: () => void usersRequest.fetch(),
  });

  return (
    <FormDialog
      trigger={trigger}
      title="Create manager"
      description="Promote an existing unassigned user. No additional EAL or feature fields are required."
      submitLabel="Create manager"
      loading={createRequest.isLoading}
      open={open}
      onOpenChange={setOpen}
      form={form}
      onSubmit={(data) => void createRequest.fetch(data)}
    >
      <Field data-invalid={Boolean(form.formState.errors.userId)}>
        <FieldLabel htmlFor="manager-user">User</FieldLabel>
        <Controller
          control={form.control}
          name="userId"
          render={({ field }) => (
            <EntityAutocomplete
              id="manager-user"
              value={(usersRequest.data ?? []).find(
                (candidate) => candidate.id === field.value,
              )}
              items={usersRequest.data ?? []}
              placeholder="Search for a user…"
              emptyLabel="No unassigned users found."
              loading={usersRequest.isLoading}
              invalid={Boolean(form.formState.errors.userId)}
              getKey={(candidate: UserResponse) => String(candidate.id)}
              getLabel={(candidate: UserResponse) =>
                formatOptionLabel(candidate.fullName, candidate.email)
              }
              onChange={(candidate) => field.onChange(candidate?.id ?? 0)}
            />
          )}
        />
        <FieldError errors={[form.formState.errors.userId]} />
      </Field>
    </FormDialog>
  );
};
