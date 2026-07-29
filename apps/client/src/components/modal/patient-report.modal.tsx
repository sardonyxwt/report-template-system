import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import {
  type ClinicReportResponse,
  type PatientReportCreateRequest,
  PatientReportCreateRequestSchema,
  REFERENCE_ITEMS_LIMIT,
  type TemplateResponse,
} from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { api } from '../../api/client.api';
import { useRequest } from '../../hooks/request.hook';
import { useAuthenticatedUser } from '../../providers/auth.provider';
import {
  formatDateTime,
  formatOptionLabel,
} from '../../utils/formatting.utils';
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
        take: REFERENCE_ITEMS_LIMIT,
      }),
      api.template.findMany({
        where:
          user.role === UserRole.Admin
            ? {}
            : { clinic: { managerId: user.id } },
        orderBy: { name: 'asc' },
        take: REFERENCE_ITEMS_LIMIT,
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
          noValidate
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
                <EntityAutocomplete
                  id="patient-report-source"
                  value={(referencesRequest.data?.reports ?? []).find(
                    (report) => report.id === field.value,
                  )}
                  items={referencesRequest.data?.reports ?? []}
                  placeholder="Search for a clinic report…"
                  emptyLabel="No clinic reports found."
                  loading={referencesRequest.isLoading}
                  invalid={Boolean(form.formState.errors.reportId)}
                  getKey={(report: ClinicReportResponse) => String(report.id)}
                  getLabel={(report: ClinicReportResponse) =>
                    `${formatOptionLabel(
                      report.patient.user.fullName,
                      report.patient.user.email,
                    )} · ${report.clinic.name} · ${formatDateTime(
                      report.createdAt,
                    )}`
                  }
                  onChange={(report) => {
                    field.onChange(report?.id ?? 0);
                    form.setValue('templateId', 0);
                  }}
                />
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
                <EntityAutocomplete
                  id="patient-report-template"
                  value={templates.find(
                    (template) => template.id === field.value,
                  )}
                  items={templates}
                  placeholder={
                    reportId
                      ? 'Search for a compatible template…'
                      : 'Select a clinic report first'
                  }
                  emptyLabel="No compatible templates found."
                  loading={referencesRequest.isLoading}
                  disabled={!reportId}
                  invalid={Boolean(form.formState.errors.templateId)}
                  getKey={(template: TemplateResponse) => String(template.id)}
                  getLabel={(template: TemplateResponse) => template.name}
                  onChange={(template) => field.onChange(template?.id ?? 0)}
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
                Create patient report
              </SubmitLabel>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
