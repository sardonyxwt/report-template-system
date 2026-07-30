import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  type UserCreateRequest,
  UserCreateRequestSchema,
  type UserResponse,
  type UserUpdateRequest,
  UserUpdateRequestSchema,
} from 'platform/common-base';
import { api } from '../../api/client.api';
import { useRequest } from '../../hooks/request.hook';
import { useAuthenticatedUser } from '../../providers/auth.provider';
import { getErrorMessage } from '../../utils/request.utils';
import {
  FormDialog,
  useDialogReset,
  useFormDialog,
} from '../form/form-dialog.component';
import { Field, FieldError, FieldLabel } from '../shadcn/ui/field';
import { Input } from '../shadcn/ui/input';

type UserForm = UserCreateRequest | UserUpdateRequest;

const createDefaultValues = (user?: UserResponse): UserForm =>
  user
    ? {
        id: user.id,
        email: user.email,
        fullName: user.fullName ?? null,
      }
    : {
        email: '',
        fullName: null,
      };

export const UserModal = ({
  trigger,
  user,
  onSaved,
}: {
  trigger: ReactNode;
  user?: UserResponse;
  onSaved: () => void;
}) => {
  const currentUser = useAuthenticatedUser();
  const { open, setOpen, closeAndSave } = useFormDialog({ onSaved });
  const isEditingSelf = user?.id === currentUser.id;
  const schema = user ? UserUpdateRequestSchema : UserCreateRequestSchema;
  const form = useForm<UserForm>({
    resolver: zodResolver(schema) as Resolver<UserForm>,
    defaultValues: createDefaultValues(user),
  });
  const saveRequest = useRequest(
    (data: UserForm) =>
      user
        ? api.user.update(data as UserUpdateRequest)
        : api.user.create(data as UserCreateRequest),
    {
      onSuccess: () => {
        toast.success(`User ${user ? 'updated' : 'created'}.`);
        closeAndSave();
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    },
  );

  useDialogReset({
    open,
    reset: form.reset,
    getResetValues: () => createDefaultValues(user),
  });

  return (
    <FormDialog
      trigger={trigger}
      title={user ? 'Edit user' : 'Create user'}
      description={
        user
          ? 'Update the public account information.'
          : 'Create a platform account. Managers are promoted separately.'
      }
      submitLabel={user ? 'Save changes' : 'Create user'}
      loading={saveRequest.isLoading}
      open={open}
      onOpenChange={setOpen}
      form={form}
      onSubmit={(data) => void saveRequest.fetch(data)}
    >
      <Field data-invalid={Boolean(form.formState.errors.fullName)}>
        <FieldLabel htmlFor="user-full-name">Full name</FieldLabel>
        <Input
          id="user-full-name"
          placeholder="Alex Morgan"
          aria-invalid={Boolean(form.formState.errors.fullName)}
          {...form.register('fullName', {
            setValueAs: (value) => value || null,
          })}
        />
        <FieldError errors={[form.formState.errors.fullName]} />
      </Field>
      <Field data-invalid={Boolean(form.formState.errors.email)}>
        <FieldLabel htmlFor="user-email">Email</FieldLabel>
        {isEditingSelf ? (
          <>
            <Input
              id="user-email"
              type="email"
              value={user.email}
              disabled
              aria-invalid={Boolean(form.formState.errors.email)}
            />
            <input type="hidden" {...form.register('email')} />
          </>
        ) : (
          <Input
            id="user-email"
            type="email"
            placeholder="alex@example.com"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register('email')}
          />
        )}
        <FieldError errors={[form.formState.errors.email]} />
      </Field>
    </FormDialog>
  );
};
