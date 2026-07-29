import { type ColumnDef } from '@tanstack/react-table';
import { EyeIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type ClinicReportResponse,
  type PatientResponse,
  REFERENCE_ITEMS_LIMIT,
} from 'platform/common-base';
import { searchQueryOrUndef, UserRole } from 'platform/prisma';
import { api } from '../api/client.api';
import { ClinicReportModal } from '../components/modal/clinic-report.modal';
import { AsyncAutocompleteFilter } from '../components/resource-filters.component';
import { ResourcePage } from '../components/resource-page.component';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuthenticatedUser } from '../providers/auth.provider';
import { routes } from '../routes';
import { formatDateTime, formatOptionLabel } from '../utils/formatting.utils';

export const ClinicReportsPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientResponse>();
  const columns = useMemo<ColumnDef<ClinicReportResponse>[]>(
    () => [
      {
        id: 'patient',
        header: 'Patient',
        cell: ({ row }) =>
          formatOptionLabel(
            row.original.patient.user.fullName,
            row.original.patient.user.email,
          ),
      },
      {
        id: 'clinic',
        header: 'Clinic',
        cell: ({ row }) => row.original.clinic.name,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: 'open',
        header: '',
        cell: () => <EyeIcon className="size-4 text-muted-foreground" />,
      },
    ],
    [],
  );
  const loadPatients = useCallback(
    async (search: string) => {
      const response = await api.patient.findMany({
        where: {
          AND: [
            user.role === UserRole.Admin
              ? {}
              : { clinic: { managerId: user.id } },
            search
              ? {
                  user: {
                    OR: [
                      {
                        fullName: searchQueryOrUndef(search),
                      },
                      {
                        email: searchQueryOrUndef(search),
                      },
                    ],
                  },
                }
              : {},
          ],
        },
        orderBy: { userId: 'asc' },
        take: REFERENCE_ITEMS_LIMIT,
      });
      return response.items;
    },
    [user.id, user.role],
  );

  return (
    <ResourcePage
      title="Clinic reports"
      description="Review source reports generated for clinic patients."
      itemName="clinic report"
      columns={columns}
      load={(pagination) =>
        api.clinicReport.findMany({
          where: {
            AND: [
              user.role === UserRole.Admin
                ? {}
                : { clinic: { managerId: user.id } },
              patient ? { patientId: patient.userId } : {},
            ],
          },
          orderBy: { createdAt: 'desc' },
          ...pagination,
        })
      }
      loadKey={patient ? String(patient.userId) : ''}
      filters={
        <AsyncAutocompleteFilter
          value={patient}
          placeholder="Search patient by name or email"
          load={loadPatients}
          getKey={(item) => String(item.userId)}
          getLabel={(item) =>
            formatOptionLabel(item.user.fullName, item.user.email)
          }
          onChange={setPatient}
        />
      }
      getRowId={(report) => String(report.id)}
      createAction={
        access.clinicReports.create({ managerId: user.id })
          ? (reload, trigger) => (
              <ClinicReportModal trigger={trigger} onSaved={reload} />
            )
          : undefined
      }
      canDelete={(report) =>
        access.clinicReports.delete({
          managerId: report.clinic.managerId,
        })
      }
      deleteAction={(report) => api.clinicReport.del(report.id)}
      onRowClick={(report) => navigate(routes.app.clinicReport(report.id))}
    />
  );
};
