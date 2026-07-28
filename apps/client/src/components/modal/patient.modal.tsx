import { zodResolver } from '@hookform/resolvers/zod';
import {
  type ClinicResponse,
  type PatientCreateRequest,
  PatientCreateRequestSchema,
} from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { type ReactNode, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { api } from '../../api/client.api';
import { useRequest } from '../../hooks/request.hook';
import { useAuthenticatedUser } from '../../providers/auth.provider';
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

export const PatientModal = ({
  trigger,
  onSaved,
}: {
  trigger: ReactNode;
  onSaved: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const user = useAuthenticatedUser();
  const form = useForm<PatientCreateRequest>({
    resolver: zodResolver(PatientCreateRequestSchema),
    defaultValues: { clinicId: 0, email: '' },
  });
  const clinicsRequest = useRequest(async () => {
    const response = await api.clinic.findMany({
      where: user.role === UserRole.Admin ? {} : { managerId: user.id },
      orderBy: { name: 'asc' },
      take: 100,
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
    }
  }, [clinicsRequest.fetch, form, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign patient</DialogTitle>
          <DialogDescription>
            Assign an existing user account that is not already a manager or a
            patient.
          </DialogDescription>
        </DialogHeader>
        <form
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
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger id="patient-clinic" className="w-full">
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
          <FormFieldGroup
            label="User email"
            htmlFor="patient-email"
            error={form.formState.errors.email?.message}
          >
            <Input
              id="patient-email"
              type="email"
              placeholder="patient@example.com"
              {...form.register('email')}
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
                Assign patient
              </SubmitLabel>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
