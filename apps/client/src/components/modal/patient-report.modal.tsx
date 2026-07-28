import { zodResolver } from '@hookform/resolvers/zod';
import {
  type ClinicReportResponse,
  type PatientReportCreateRequest,
  PatientReportCreateRequestSchema,
  type TemplateResponse,
} from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../shadcn/ui/select';

export const PatientReportModal = ({
  trigger,
  onSaved,
}: {
  trigger: ReactNode;
  onSaved: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const user = useAuthenticatedUser();
  const form = useForm<PatientReportCreateRequest>({
    resolver: zodResolver(PatientReportCreateRequestSchema),
    defaultValues: { reportId: 0, templateId: 0 },
  });
  const reportId = useWatch({ control: form.control, name: 'reportId' });
  const referencesRequest = useRequest(async () => {
    const [reports, templates] = await Promise.all([
      api.clinicReport.findMany({
        where:
          user.role === UserRole.Admin
            ? {}
            : { clinic: { managerId: user.id } },
        orderBy: { createdAt: 'desc' },
        take: 250,
      }),
      api.template.findMany({
        where:
          user.role === UserRole.Admin
            ? {}
            : { clinic: { managerId: user.id } },
        orderBy: { name: 'asc' },
        take: 250,
      }),
    ]);
    return { reports: reports.items, templates: templates.items };
  });
  const createRequest = useRequest(api.patientReport.create, {
    onSuccess: () => {
      toast.success('Patient report created.');
      setOpen(false);
      onSaved();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const selectedReport = referencesRequest.data?.reports.find(
    (report) => report.id === reportId,
  );
  const templates = useMemo(
    () =>
      (referencesRequest.data?.templates ?? []).filter(
        (template) => template.clinicId === selectedReport?.clinicId,
      ),
    [referencesRequest.data?.templates, selectedReport?.clinicId],
  );

  useEffect(() => {
    if (open) {
      form.reset({ reportId: 0, templateId: 0 });
      void referencesRequest.fetch().catch(() => undefined);
    }
  }, [form, open, referencesRequest.fetch]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create patient report</DialogTitle>
          <DialogDescription>
            Bind a clinic report to a template from the same clinic.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(
            (data) => void createRequest.fetch(data).catch(() => undefined),
          )}
        >
          <FormFieldGroup
            label="Clinic report"
            htmlFor="patient-report-source"
            error={form.formState.errors.reportId?.message}
          >
            <Controller
              control={form.control}
              name="reportId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(value) => {
                    field.onChange(Number(value));
                    form.setValue('templateId', 0);
                  }}
                >
                  <SelectTrigger id="patient-report-source" className="w-full">
                    <SelectValue placeholder="Select clinic report" />
                  </SelectTrigger>
                  <SelectContent>
                    {(referencesRequest.data?.reports ?? []).map(
                      (report: ClinicReportResponse) => (
                        <SelectItem key={report.id} value={String(report.id)}>
                          Report #{report.id} · Patient #{report.patientId}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </FormFieldGroup>
          <FormFieldGroup
            label="Template"
            htmlFor="patient-report-template"
            error={form.formState.errors.templateId?.message}
          >
            <Controller
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ''}
                  disabled={!reportId}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger
                    id="patient-report-template"
                    className="w-full"
                  >
                    <SelectValue placeholder="Select compatible template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template: TemplateResponse) => (
                      <SelectItem key={template.id} value={String(template.id)}>
                        {template.name}
                      </SelectItem>
                    ))}
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
            <Button type="submit" disabled={createRequest.isLoading}>
              <SubmitLabel loading={createRequest.isLoading}>
                Create patient report
              </SubmitLabel>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
