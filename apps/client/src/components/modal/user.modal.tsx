import { zodResolver } from '@hookform/resolvers/zod';
import {
  type UserCreateRequest,
  UserCreateRequestSchema,
  type UserResponse,
  type UserUpdateRequest,
  UserUpdateRequestSchema,
} from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { type ReactNode, useEffect, useState } from 'react';
import { type Resolver, Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { api } from '../../api/client.api';
import { useRequest } from '../../hooks/request.hook';
import { getErrorMessage } from '../../utils/request.utils';
import { FormFieldGroup } from '../form/form-field-group.component';
import { SubmitLabel } from '../form/submit-label.component';
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
import { Input } from '../shadcn/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../shadcn/ui/select';

type UserForm = UserCreateRequest | UserUpdateRequest;

export const UserModal = ({
  trigger,
  user,
  onSaved,
}: {
  trigger: ReactNode;
  user?: UserResponse;
  onSaved: () => void;
}) => {
  const [open, setOpen] = useState(false);
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
        setOpen(false);
        onSaved();
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    },
  );

  useEffect(() => {
    if (open) {
      form.reset(createDefaultValues(user));
    }
  }, [form, open, user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Edit user' : 'Create user'}</DialogTitle>
          <DialogDescription>
            {user
              ? 'Update the public account information.'
              : 'Create a platform account. Managers are promoted separately.'}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(
            (data) => void saveRequest.fetch(data).catch(() => undefined),
          )}
        >
          <FormFieldGroup
            label="Full name"
            htmlFor="user-full-name"
            error={form.formState.errors.fullName?.message}
          >
            <Input
              id="user-full-name"
              placeholder="Alex Morgan"
              {...form.register('fullName', {
                setValueAs: (value) => value || null,
              })}
            />
          </FormFieldGroup>
          <FormFieldGroup
            label="Email"
            htmlFor="user-email"
            error={form.formState.errors.email?.message}
          >
            <Input
              id="user-email"
              type="email"
              placeholder="alex@example.com"
              {...form.register('email')}
            />
          </FormFieldGroup>
          <FormFieldGroup
            label="Role"
            htmlFor="user-role"
            error={form.formState.errors.role?.message}
          >
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value}
                  disabled={user?.role === UserRole.Manager}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="user-role" className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.User}>User</SelectItem>
                    <SelectItem value={UserRole.Admin}>Admin</SelectItem>
                    {user?.role === UserRole.Manager && (
                      <SelectItem value={UserRole.Manager}>Manager</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </FormFieldGroup>
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
                {user ? 'Save changes' : 'Create user'}
              </SubmitLabel>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const createDefaultValues = (user?: UserResponse): UserForm =>
  user
    ? {
        id: user.id,
        email: user.email,
        fullName: user.fullName ?? null,
        role: user.role,
      }
    : {
        email: '',
        fullName: null,
        role: UserRole.User,
      };
