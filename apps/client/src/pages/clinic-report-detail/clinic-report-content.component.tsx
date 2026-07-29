import {
  CalendarDaysIcon,
  HospitalIcon,
  StethoscopeIcon,
  UserRoundIcon,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { type ClinicReportResponse } from 'platform/common-base';
import { Badge } from '../../components/shadcn/ui/badge';
import { formatDate, formatDateTime } from '../../utils/formatting.utils';
import { ClinicReportBlock } from './clinic-report-block.component';

const ReportMeta = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) => (
  <div className="flex min-w-0 items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary [&>svg]:size-5">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 min-w-0 break-words text-sm font-semibold leading-snug">
        {value}
      </div>
    </div>
  </div>
);

export const ClinicReportContent = ({
  report,
}: {
  report: ClinicReportResponse;
}) => {
  const coverBlock = report.data.blocks.find((block) => block.type === 'cover');
  const cover = coverBlock?.type === 'cover' ? coverBlock.value : undefined;
  const patientName = report.patient.user.fullName?.trim();
  const patientEmail = report.patient.user.email;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-8">
      <div>
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/15 via-card to-card px-5 py-7 shadow-sm sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Badge>
                <StethoscopeIcon />
                Clinic report
              </Badge>
              <Badge variant="outline" className="bg-background/60">
                {report.clinic.name}
              </Badge>
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              {cover?.title ?? 'Clinical report overview'}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              A structured clinical view of findings, priorities, goals and
              recommended next steps for{' '}
              {cover?.patient.name ?? patientName ?? patientEmail}.
            </p>
            {cover?.preparedBy && (
              <div className="mt-6 flex items-center gap-3 text-sm">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <UserRoundIcon className="size-5" />
                </div>
                <div>
                  <p className="text-muted-foreground">Prepared by</p>
                  <p className="font-semibold">{cover.preparedBy.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ReportMeta
          icon={<UserRoundIcon />}
          label="Patient"
          value={
            <>
              {patientName && (
                <p className="break-words text-sm font-semibold">
                  {patientName}
                </p>
              )}
              <p
                className={
                  patientName
                    ? 'mt-0.5 break-all text-xs font-normal text-muted-foreground'
                    : 'break-all text-xs font-medium'
                }
              >
                {patientEmail}
              </p>
            </>
          }
        />
        <ReportMeta
          icon={<HospitalIcon />}
          label="Clinic"
          value={report.clinic.name}
        />
        <ReportMeta
          icon={<CalendarDaysIcon />}
          label="Assessment"
          value={
            cover?.assessmentDate
              ? formatDate(cover.assessmentDate)
              : formatDateTime(report.createdAt)
          }
        />
      </div>

      <div className="grid min-w-0 gap-10">
        {report.data.blocks.map((block, index) => (
          <ClinicReportBlock key={`${block.type}-${index}`} block={block} />
        ))}
      </div>
    </div>
  );
};
