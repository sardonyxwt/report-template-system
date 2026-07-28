import { zodResolver } from '@hookform/resolvers/zod';
import {
  type ClinicCreateRequest,
  ClinicCreateRequestSchema,
  type ClinicResponse,
  type ClinicUpdateRequest,
  ClinicUpdateRequestSchema,
  type UserResponse,
} from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { type ReactNode, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { api } from '../../api/client.api';
import { useRequest } from '../../hooks/request.hook';
import { useAccessControl } from '../../providers/access-control.provider';
import { useAuthenticatedUser } from '../../providers/auth.provider';
import { formatOptionLabel } from '../../utils/formatting.utils';
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

type ClinicForm = ClinicCreateRequest | ClinicUpdateRequest;

export const ClinicModal = ({
  trigger,
  clinic,
  onSaved,
}: {
  trigger: ReactNode;
  clinic?: ClinicResponse;
  onSaved: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const user = useAuthenticatedUser();
  const access = useAccessControl();
  const canAssignManager = access.managers.create();
  const form = useForm<ClinicForm>({
    resolver: zodResolver(
      clinic ? ClinicUpdateRequestSchema : ClinicCreateRequestSchema,
    ),
    defaultValues: createDefaultValues(clinic, user.id),
  });
  const managersRequest = useRequest(async () => {
    const response = await api.user.findMany({
      where: { role: UserRole.Manager },
      orderBy: { email: 'asc' },
      take: 100,
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
        setOpen(false);
        onSaved();
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    },
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    form.reset(createDefaultValues(clinic, user.id));
    if (canAssignManager) {
      void managersRequest.fetch().catch(() => undefined);
    }
  }, [canAssignManager, clinic, form, managersRequest.fetch, open, user.id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{clinic ? 'Edit clinic' : 'Create clinic'}</DialogTitle>
          <DialogDescription>
            Managers automatically own clinics they create. Administrators can
            assign a manager.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(
            (data) => void saveRequest.fetch(data).catch(() => undefined),
          )}
        >
          <FormFieldGroup
            label="Clinic name"
            htmlFor="clinic-name"
            error={form.formState.errors.name?.message}
          >
            <Input
              id="clinic-name"
              placeholder="Northstar Health"
              {...form.register('name')}
            />
          </FormFieldGroup>
          {canAssignManager && (
            <FormFieldGroup
              label="Manager"
              htmlFor="clinic-manager"
              error={form.formState.errors.managerId?.message}
            >
              <Controller
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger id="clinic-manager" className="w-full">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {(managersRequest.data ?? []).map(
                        (manager: UserResponse) => (
                          <SelectItem
                            key={manager.id}
                            value={String(manager.id)}
                          >
                            {formatOptionLabel(manager.fullName, manager.email)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormFieldGroup>
          )}
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
                {clinic ? 'Save changes' : 'Create clinic'}
              </SubmitLabel>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

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
