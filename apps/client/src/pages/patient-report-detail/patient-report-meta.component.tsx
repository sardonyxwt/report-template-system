import { type ReactNode } from 'react';

type PatientReportMetaProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

export const PatientReportMeta = ({
  icon,
  label,
  value,
}: PatientReportMetaProps) => (
  <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary [&>svg]:size-5">
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-semibold">{value}</p>
    </div>
  </div>
);
