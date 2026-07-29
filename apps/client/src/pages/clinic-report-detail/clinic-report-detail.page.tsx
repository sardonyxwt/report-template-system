import { FileHeartIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../../api/client.api';
import { FullPageLoader } from '../../components/full-page-loader.component';
import { Button } from '../../components/shadcn/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../components/shadcn/ui/empty';
import { useRequest } from '../../hooks/request.hook';
import { routes } from '../../routes';
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
      void reportRequest.fetch(reportId).catch(() => undefined);
    }
  }, [reportId, reportRequest.fetch]);

  if (!Number.isInteger(reportId) || reportId <= 0) {
    return <Navigate to={routes.app.clinicReports()} replace />;
  }

  if (reportRequest.isLoading || reportRequest.isInitial) {
    return <FullPageLoader message="Loading clinic report…" />;
  }

  if (!reportRequest.data) {
    return (
      <Empty className="min-h-96 rounded-xl border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileHeartIcon />
          </EmptyMedia>
          <EmptyTitle>Clinic report not found</EmptyTitle>
          <EmptyDescription>
            It may have been removed or is not available to your account.
          </EmptyDescription>
          <Button asChild variant="outline">
            <Link to={routes.app.clinicReports()}>Back to clinic reports</Link>
          </Button>
        </EmptyHeader>
      </Empty>
    );
  }

  return <ClinicReportContent report={reportRequest.data} />;
};
