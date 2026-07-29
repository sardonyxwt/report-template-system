import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  type ClinicResponse,
  type PatientCreateRequest,
  PatientCreateRequestSchema,
  REFERENCE_ITEMS_LIMIT,
  type UserResponse,
} from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { api } from '../../api/client.api';
import { useRequest } from '../../hooks/request.hook';
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

export const PatientModal = ({
  trigger,
  onSaved,
}: {
  trigger: ReactNode;
  onSaved: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const user = useAuthenticatedUser();
  const isAdmin = user.role === UserRole.Admin;
  const form = useForm<PatientCreateRequest>({
    resolver: zodResolver(PatientCreateRequestSchema),
    defaultValues: { clinicId: 0, email: '' },
  });
  const clinicsRequest = useRequest(async () => {
    const response = await api.clinic.findMany({
      where: isAdmin ? {} : { managerId: user.id },
      orderBy: { name: 'asc' },
      take: REFERENCE_ITEMS_LIMIT,
    });
    return response.items;
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
  const createRequest = useRequest(api.patient.create, {
    onSuccess: () => {
      toast.success('Patient assigned.');
      setOpen(false);
      onSaved();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  useEffect(() => {
    if (open) {
      form.reset({ clinicId: 0, email: '' });
      void clinicsRequest.fetch().catch(() => undefined);
      if (isAdmin) {
        void usersRequest.fetch().catch(() => undefined);
      }
    }
  }, [clinicsRequest.fetch, form, isAdmin, open, usersRequest.fetch]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign patient</DialogTitle>
          <DialogDescription>
            {isAdmin
              ? 'Select an existing unassigned user account and a clinic.'
              : 'Enter the email of an existing unassigned user account and select one of your clinics.'}
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
            label="Clinic"
            htmlFor="patient-clinic"
            error={form.formState.errors.clinicId?.message}
          >
            <Controller
              control={form.control}
              name="clinicId"
              render={({ field }) => (
                <EntityAutocomplete
                  id="patient-clinic"
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
          {isAdmin ? (
            <FormFieldGroup
              label="User"
              htmlFor="patient-user"
              error={form.formState.errors.email?.message}
            >
              <Controller
                control={form.control}
                name="email"
                render={({ field }) => (
                  <EntityAutocomplete
                    id="patient-user"
                    value={(usersRequest.data ?? []).find(
                      (patientUser) => patientUser.email === field.value,
                    )}
                    items={usersRequest.data ?? []}
                    placeholder="Search for a user…"
                    emptyLabel="No unassigned users found."
                    loading={usersRequest.isLoading}
                    invalid={Boolean(form.formState.errors.email)}
                    getKey={(patientUser: UserResponse) =>
                      String(patientUser.id)
                    }
                    getLabel={(patientUser: UserResponse) =>
                      formatOptionLabel(patientUser.fullName, patientUser.email)
                    }
                    onChange={(patientUser) =>
                      field.onChange(patientUser?.email ?? '')
                    }
                  />
                )}
              />
            </FormFieldGroup>
          ) : (
            <FormFieldGroup
              label="User email"
              htmlFor="patient-email"
              error={form.formState.errors.email?.message}
            >
              <Input
                id="patient-email"
                type="email"
                placeholder="patient@example.com"
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register('email')}
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
            <Button type="submit" disabled={createRequest.isLoading}>
              <SubmitLabel loading={createRequest.isLoading}>
                Assign patient
              </SubmitLabel>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
