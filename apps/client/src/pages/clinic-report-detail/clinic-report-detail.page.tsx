import { FileHeartIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../../api/client.api';
import { PageToolbar } from '../../components/layout/page-toolbar.component';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../components/shadcn/ui/empty';
import { Spinner } from '../../components/shadcn/ui/spinner';
import { useRequest } from '../../hooks/request.hook';
import { routes } from '../../routes/config';
import { getErrorMessage } from '../../utils/request.utils';
import { ClinicReportContent } from './clinic-report-content.component';

export const ClinicReportDetailPage = () => {
  const { reportId: reportIdParam } = useParams();
  const reportId = Number(reportIdParam);
  const reportRequest = useRequest(api.clinicReport.findOne, {
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  useEffect(() => {
    if (Number.isInteger(reportId) && reportId > 0) {
      void reportRequest.fetch(reportId);
    }
  }, [reportId, reportRequest.fetch]);

  if (!Number.isInteger(reportId) || reportId <= 0) {
    return <Navigate to={routes.app.clinicReports} replace />;
  }

  const loading = reportRequest.isLoading || reportRequest.isInitial;

  return (
    <div className="flex min-h-full flex-col">
      <PageToolbar
        title="Report"
        breadcrumbs={[
          {
            label: 'Clinic reports',
            href: routes.app.clinicReports,
          },
        ]}
      />
      <div className="flex min-h-0 flex-1 flex-col p-4 md:p-6">
        {loading ? (
          <div
            role="status"
            className="flex min-h-80 flex-1 items-center justify-center"
          >
            <Spinner className="size-6 text-muted-foreground" />
            <span className="sr-only">Loading clinic report…</span>
          </div>
        ) : reportRequest.data ? (
          <ClinicReportContent report={reportRequest.data} />
        ) : (
          <Empty className="min-h-96 rounded-xl border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileHeartIcon />
              </EmptyMedia>
              <EmptyTitle>Clinic report not found</EmptyTitle>
              <EmptyDescription>
                It may have been removed or is not available to your account.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
};
