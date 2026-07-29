import { type ReactNode } from 'react';

type FormFieldGroupProps = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
};

export const FormFieldGroup = ({
  label,
  htmlFor,
  error,
  children,
}: FormFieldGroupProps) => (
  <div className="grid content-start gap-2">
    <label className="text-sm font-medium" htmlFor={htmlFor}>
      {label}
    </label>
    {children}
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
);
