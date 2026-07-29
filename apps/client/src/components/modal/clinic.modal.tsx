import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useEffect, useState } from 'react';
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
    form.reset(
      createDefaultValues(clinic, canAssignManager ? undefined : user.id),
    );
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
          noValidate
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
              aria-invalid={Boolean(form.formState.errors.name)}
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
