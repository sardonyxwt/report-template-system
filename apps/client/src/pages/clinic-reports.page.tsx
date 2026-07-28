import { type ColumnDef } from '@tanstack/react-table';
import { type ClinicReportResponse } from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { useMemo } from 'react';
import { api } from '../api/client.api';
import { ClinicReportModal } from '../components/modal/clinic-report.modal';
import { ResourcePage } from '../components/resource-page.component';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuthenticatedUser } from '../providers/auth.provider';
import { formatDateTime } from '../utils/formatting.utils';

export const ClinicReportsPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const columns = useMemo<ColumnDef<ClinicReportResponse>[]>(
    () => [
      { accessorKey: 'id', header: 'Report ID' },
      { accessorKey: 'patientId', header: 'Patient ID' },
      { accessorKey: 'clinicId', header: 'Clinic ID' },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: 'blocks',
        header: 'Blocks',
        cell: ({ row }) => row.original.data.blocks.length,
      },
    ],
    [],
  );

  return (
    <ResourcePage
      title="Clinic reports"
      description="Review source reports generated for clinic patients."
      itemName="clinic report"
      columns={columns}
      load={async () => {
        const response = await api.clinicReport.findMany({
          where:
            user.role === UserRole.Admin
              ? {}
              : { clinic: { managerId: user.id } },
          orderBy: { createdAt: 'desc' },
          take: 500,
        });
        return response.items;
      }}
      getRowId={(report) => String(report.id)}
      createAction={
        access.clinicReports.create({ managerId: user.id })
          ? (reload, trigger) => (
              <ClinicReportModal trigger={trigger} onSaved={reload} />
            )
          : undefined
      }
    />
  );
};
