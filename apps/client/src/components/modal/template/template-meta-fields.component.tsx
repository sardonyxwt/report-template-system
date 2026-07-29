import { Controller, type UseFormReturn } from 'react-hook-form';
import { type ClinicResponse } from 'platform/common-base';
import { EntityAutocomplete } from '../../form/entity-autocomplete.component';
import { Field, FieldError, FieldLabel } from '../../shadcn/ui/field';
import { Input } from '../../shadcn/ui/input';
import { type TemplateForm } from './template.types';

export const TemplateMetaFields = ({
  form,
  clinics,
  clinicsLoading,
}: {
  form: UseFormReturn<TemplateForm>;
  clinics: ClinicResponse[];
  clinicsLoading: boolean;
}) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <Field data-invalid={Boolean(form.formState.errors.name)}>
      <FieldLabel htmlFor="template-name">Template name</FieldLabel>
      <Input
        id="template-name"
        placeholder="Patient wellbeing report"
        aria-invalid={Boolean(form.formState.errors.name)}
        {...form.register('name')}
      />
      <FieldError errors={[form.formState.errors.name]} />
    </Field>
    <Field data-invalid={Boolean(form.formState.errors.clinicId)}>
      <FieldLabel htmlFor="template-clinic">Clinic</FieldLabel>
      <Controller
        control={form.control}
        name="clinicId"
        render={({ field }) => (
          <EntityAutocomplete
            id="template-clinic"
            value={clinics.find((clinic) => clinic.id === field.value)}
            items={clinics}
            placeholder="Search for a clinic…"
            emptyLabel="No clinics found."
            loading={clinicsLoading}
            invalid={Boolean(form.formState.errors.clinicId)}
            getKey={(clinic: ClinicResponse) => String(clinic.id)}
            getLabel={(clinic: ClinicResponse) => clinic.name}
            onChange={(clinic) => field.onChange(clinic?.id ?? 0)}
          />
        )}
      />
      <FieldError errors={[form.formState.errors.clinicId]} />
    </Field>
  </div>
);
