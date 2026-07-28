import { type ColumnDef } from '@tanstack/react-table';
import { EyeIcon } from 'lucide-react';
import { type PatientReportResponse } from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.api';
import { PatientReportModal } from '../components/modal/patient-report.modal';
import { ResourcePage } from '../components/resource-page.component';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuthenticatedUser } from '../providers/auth.provider';
import { routes } from '../routes';
import { formatDateTime } from '../utils/formatting.utils';

export const PatientReportsPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const navigate = useNavigate();
  const columns = useMemo<ColumnDef<PatientReportResponse>[]>(
    () => [
      { accessorKey: 'reportId', header: 'Report ID' },
      {
        id: 'patient',
        header: 'Patient ID',
        cell: ({ row }) => row.original.report.patientId,
      },
      {
        id: 'clinic',
        header: 'Clinic ID',
        cell: ({ row }) => row.original.report.clinicId,
      },
      { accessorKey: 'templateId', header: 'Template ID' },
      {
        id: 'created',
        header: 'Created',
        cell: ({ row }) => formatDateTime(row.original.report.createdAt),
      },
      {
        id: 'open',
        header: '',
        cell: () => <EyeIcon className="size-4 text-muted-foreground" />,
      },
    ],
    [],
  );

  return (
    <ResourcePage
      title="Patient reports"
      description="Open patient-ready reports available to your account."
      itemName="patient report"
      columns={columns}
      load={async () => {
        const response = await api.patientReport.findMany({
          where:
            user.role === UserRole.Admin
              ? {}
              : user.role === UserRole.Manager
                ? { report: { clinic: { managerId: user.id } } }
                : { report: { patientId: user.id } },
          orderBy: { report: { createdAt: 'desc' } },
          take: 500,
        });
        return response.items;
      }}
      getRowId={(report) => String(report.reportId)}
      createAction={
        access.patientReports.create({
          reportManagerId: user.id,
          reportClinicId: 0,
          templateManagerId: user.id,
          templateClinicId: 0,
        })
          ? (reload, trigger) => (
              <PatientReportModal trigger={trigger} onSaved={reload} />
            )
          : undefined
      }
      onRowClick={(report) =>
        navigate(routes.app.patientReport(report.reportId))
      }
    />
  );
};
