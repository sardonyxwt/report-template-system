import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  type ClinicResponse,
  type PatientCreateRequest,
  PatientCreateRequestSchema,
  REFERENCE_ITEMS_LIMIT,
  type UserResponse,
  isWho,
} from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { api } from '../../api/client.api';
import { useRequest } from '../../hooks/request.hook';
import { useAuthenticatedUser } from '../../providers/auth.provider';
import { formatOptionLabel } from '../../utils/formatting.utils';
import { loadClinics } from '../../utils/reference-loaders.utils';
import { getErrorMessage } from '../../utils/request.utils';
import { EntityAutocomplete } from '../form/entity-autocomplete.component';
import {
  FormDialog,
  useDialogReset,
  useFormDialog,
} from '../form/form-dialog.component';
import { Field, FieldError, FieldLabel } from '../shadcn/ui/field';
import { Input } from '../shadcn/ui/input';

export const PatientModal = ({
  trigger,
  onSaved,
}: {
  trigger: ReactNode;
  onSaved: () => void;
}) => {
  const user = useAuthenticatedUser();
  const admin = isWho(user.role).isAdmin;
  const { open, setOpen, closeAndSave } = useFormDialog({ onSaved });
  const form = useForm<PatientCreateRequest>({
    resolver: zodResolver(PatientCreateRequestSchema),
    defaultValues: { clinicId: 0, email: '' },
  });
  const clinicsRequest = useRequest(() => loadClinics(user));
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
      closeAndSave();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  useDialogReset({
    open,
    reset: form.reset,
    getValues: () => ({ clinicId: 0, email: '' }),
    onOpen: () => {
      void clinicsRequest.fetch();
      if (admin) {
        void usersRequest.fetch();
      }
    },
  });

  return (
    <FormDialog
      trigger={trigger}
      title="Assign patient"
      description={
        admin
          ? 'Select an existing unassigned user account and a clinic.'
          : 'Enter the email of an existing unassigned user account and select one of your clinics.'
      }
      submitLabel="Assign patient"
      loading={createRequest.isLoading}
      open={open}
      onOpenChange={setOpen}
      form={form}
      onSubmit={(data) => void createRequest.fetch(data)}
    >
      <Field data-invalid={Boolean(form.formState.errors.clinicId)}>
        <FieldLabel htmlFor="patient-clinic">Clinic</FieldLabel>
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
        <FieldError errors={[form.formState.errors.clinicId]} />
      </Field>
      {admin ? (
        <Field data-invalid={Boolean(form.formState.errors.email)}>
          <FieldLabel htmlFor="patient-user">User</FieldLabel>
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
                getKey={(patientUser: UserResponse) => String(patientUser.id)}
                getLabel={(patientUser: UserResponse) =>
                  formatOptionLabel(patientUser.fullName, patientUser.email)
                }
                onChange={(patientUser) =>
                  field.onChange(patientUser?.email ?? '')
                }
              />
            )}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>
      ) : (
        <Field data-invalid={Boolean(form.formState.errors.email)}>
          <FieldLabel htmlFor="patient-email">User email</FieldLabel>
          <Input
            id="patient-email"
            type="email"
            placeholder="patient@example.com"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register('email')}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>
      )}
    </FormDialog>
  );
};
