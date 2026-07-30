import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import {
  type ClinicReportResponse,
  type PatientReportCreateRequest,
  PatientReportCreateRequestSchema,
  REFERENCE_ITEMS_LIMIT,
  type TemplateResponse,
} from 'platform/common-base';
import { api } from '../../api/client.api';
import { useRequest } from '../../hooks/request.hook';
import { useAuthenticatedUser } from '../../providers/auth.provider';
import {
  formatDateTime,
  formatOptionLabel,
} from '../../utils/formatting.utils';
import { getErrorMessage } from '../../utils/request.utils';
import { managedViaClinicWhere } from '../../utils/scope.utils';
import { EntityAutocomplete } from '../form/entity-autocomplete.component';
import {
  FormDialog,
  useDialogReset,
  useFormDialog,
} from '../form/form-dialog.component';
import { Field, FieldError, FieldLabel } from '../shadcn/ui/field';

export const PatientReportModal = ({
  trigger,
  onSaved,
}: {
  trigger: ReactNode;
  onSaved: () => void;
}) => {
  const user = useAuthenticatedUser();
  const { open, setOpen, closeAndSave } = useFormDialog({ onSaved });
  const form = useForm<PatientReportCreateRequest>({
    resolver: zodResolver(PatientReportCreateRequestSchema),
    defaultValues: { reportId: 0, templateId: 0 },
  });
  const reportId = useWatch({ control: form.control, name: 'reportId' });
  const referencesRequest = useRequest(async () => {
    const [reports, templates] = await Promise.all([
      api.clinicReport.findMany({
        where: managedViaClinicWhere(user),
        orderBy: { createdAt: 'desc' },
        take: REFERENCE_ITEMS_LIMIT,
      }),
      api.template.findMany({
        where: managedViaClinicWhere(user),
        orderBy: { name: 'asc' },
        take: REFERENCE_ITEMS_LIMIT,
      }),
    ]);
    return { reports: reports.items, templates: templates.items };
  });
  const createRequest = useRequest(api.patientReport.create, {
    onSuccess: () => {
      toast.success('Patient report created.');
      closeAndSave();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const selectedReport = referencesRequest.data?.reports.find(
    (report) => report.id === reportId,
  );
  const templates = (referencesRequest.data?.templates ?? []).filter(
    (template) => template.clinicId === selectedReport?.clinicId,
  );

  useDialogReset({
    open,
    reset: form.reset,
    getValues: () => ({ reportId: 0, templateId: 0 }),
    onOpen: () => void referencesRequest.fetch(),
  });

  return (
    <FormDialog
      trigger={trigger}
      title="Create patient report"
      description="Bind a clinic report to a template from the same clinic."
      submitLabel="Create patient report"
      loading={createRequest.isLoading}
      open={open}
      onOpenChange={setOpen}
      form={form}
      onSubmit={(data) => void createRequest.fetch(data)}
    >
      <Field data-invalid={Boolean(form.formState.errors.reportId)}>
        <FieldLabel htmlFor="patient-report-source">Clinic report</FieldLabel>
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
                )} · ${report.clinic.name} · ${formatDateTime(report.createdAt)}`
              }
              onChange={(report) => {
                field.onChange(report?.id ?? 0);
                form.setValue('templateId', 0);
              }}
            />
          )}
        />
        <FieldError errors={[form.formState.errors.reportId]} />
      </Field>
      <Field data-invalid={Boolean(form.formState.errors.templateId)}>
        <FieldLabel htmlFor="patient-report-template">Template</FieldLabel>
        <Controller
          control={form.control}
          name="templateId"
          render={({ field }) => (
            <EntityAutocomplete
              id="patient-report-template"
              value={templates.find((template) => template.id === field.value)}
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
        <FieldError errors={[form.formState.errors.templateId]} />
      </Field>
    </FormDialog>
  );
};
