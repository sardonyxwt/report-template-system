import {
  ArrowLeftIcon,
  CalendarIcon,
  LayoutTemplateIcon,
  StethoscopeIcon,
} from 'lucide-react';
import { type PatientReportResponse } from 'platform/common-base';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/shadcn/ui/badge';
import { Button } from '../../components/shadcn/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/shadcn/ui/card';
import { routes } from '../../routes';
import { formatReportField } from '../../utils/report-formatters.utils';
import { PatientReportMeta } from './patient-report-meta.component';
import { PatientReportValue } from './patient-report-value.component';

type PatientReportContentProps = {
  report: PatientReportResponse;
};

export const PatientReportContent = ({ report }: PatientReportContentProps) => (
  <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
    <div>
      <Button asChild variant="ghost" className="-ml-3">
        <Link to={routes.app.patientReports()}>
          <ArrowLeftIcon />
          Back to patient reports
        </Link>
      </Button>
      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge>Patient report</Badge>
            <Badge variant="outline">#{report.reportId}</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Clinical report overview
          </h1>
          <p className="mt-2 text-muted-foreground">
            Patient-ready report assembled from clinic data and template #
            {report.templateId}.
          </p>
        </div>
      </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      <PatientReportMeta
        icon={<StethoscopeIcon />}
        label="Patient"
        value={`#${report.report.patientId}`}
      />
      <PatientReportMeta
        icon={<LayoutTemplateIcon />}
        label="Template"
        value={`#${report.templateId}`}
      />
      <PatientReportMeta
        icon={<CalendarIcon />}
        label="Created"
        value={new Intl.DateTimeFormat('en', {
          dateStyle: 'medium',
        }).format(new Date(report.report.createdAt))}
      />
    </div>

    <div className="grid gap-4">
      {report.report.data.blocks.map((block, index) => (
        <Card key={`${block.type}-${index}`}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{formatReportField(block.type)}</CardTitle>
                <CardDescription>Report section</CardDescription>
              </div>
              <Badge variant="secondary">{block.type}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <PatientReportValue value={block.value} />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);
