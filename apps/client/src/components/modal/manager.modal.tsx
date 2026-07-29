import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useEffect, useState } from 'react';
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

export const ManagerModal = ({
  trigger,
  onSaved,
}: {
  trigger: ReactNode;
  onSaved: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const form = useForm<ManagerCreateRequest>({
    resolver: zodResolver(ManagerCreateRequestSchema),
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
      setOpen(false);
      onSaved();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  useEffect(() => {
    if (open) {
      form.reset({ userId: 0 });
      void usersRequest.fetch().catch(() => undefined);
    }
  }, [form, open, usersRequest.fetch]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create manager</DialogTitle>
          <DialogDescription>
            Promote an existing unassigned user. No additional EAL or feature
            fields are required.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={form.handleSubmit(
            (data) => void createRequest.fetch(data).catch(() => undefined),
          )}
        >
          <FormFieldGroup
            label="User"
            htmlFor="manager-user"
            error={form.formState.errors.userId?.message}
          >
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
          </FormFieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createRequest.isLoading}>
              <SubmitLabel loading={createRequest.isLoading}>
                Create manager
              </SubmitLabel>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
