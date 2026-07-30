import { type ColumnDef } from '@tanstack/react-table';
import { EyeIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type ClinicReportResponse,
  type PatientResponse,
} from 'platform/common-base';
import { api } from '../api/client.api';
import { ClinicReportModal } from '../components/modal/clinic-report.modal';
import { AsyncAutocompleteFilter } from '../components/resource-filters.component';
import { ResourcePage } from '../components/resource-page.component';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuthenticatedUser } from '../providers/auth.provider';
import { routes } from '../routes/config';
import { formatDateTime, formatOptionLabel } from '../utils/formatting.utils';
import { loadPatients } from '../utils/reference-loaders.utils';
import { managedViaClinicWhere } from '../utils/scope.utils';

const columns: ColumnDef<ClinicReportResponse>[] = [
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
];

export const ClinicReportsPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientResponse>();

  return (
    <ResourcePage
      title="Clinic reports"
      itemName="clinic report"
      columns={columns}
      load={(pagination) =>
        api.clinicReport.findMany({
          where: {
            AND: [
              managedViaClinicWhere(user),
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
          load={(search) => loadPatients(user, search)}
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
