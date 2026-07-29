import { type ColumnDef } from '@tanstack/react-table';
import { DownloadIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  type PatientReportResponse,
  type PatientResponse,
  REFERENCE_ITEMS_LIMIT,
} from 'platform/common-base';
import { searchQueryOrUndef, UserRole } from 'platform/prisma';
import { api } from '../api/client.api';
import { PatientReportModal } from '../components/modal/patient-report.modal';
import { AsyncAutocompleteFilter } from '../components/resource-filters.component';
import { ResourcePage } from '../components/resource-page.component';
import { Button } from '../components/shadcn/ui/button';
import { useRequest } from '../hooks/request.hook';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuthenticatedUser } from '../providers/auth.provider';
import { formatDateTime, formatOptionLabel } from '../utils/formatting.utils';
import { getErrorMessage } from '../utils/request.utils';

export const PatientReportsPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const [patient, setPatient] = useState<PatientResponse>();
  const downloadRequest = useRequest(
    async (report: PatientReportResponse) => {
      const blob = await api.patientReport.downloadPdf(report.reportId);
      downloadBlob(blob, `report-${report.report.createdAt}.pdf`);
    },
    {
      onSuccess: () => toast.success('Patient report downloaded.'),
      onError: (error) => toast.error(getErrorMessage(error)),
    },
  );
  const columns = useMemo<ColumnDef<PatientReportResponse>[]>(
    () => [
      {
        id: 'patient',
        header: 'Patient',
        cell: ({ row }) =>
          formatOptionLabel(
            row.original.report.patient.user.fullName,
            row.original.report.patient.user.email,
          ),
      },
      {
        id: 'clinic',
        header: 'Clinic',
        cell: ({ row }) => row.original.report.clinic.name,
      },
      {
        id: 'template',
        header: 'Template',
        cell: ({ row }) => row.original.template.name,
      },
      {
        id: 'created',
        header: 'Created',
        cell: ({ row }) => formatDateTime(row.original.report.createdAt),
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
      title="Patient reports"
      itemName="patient report"
      columns={columns}
      load={(pagination) =>
        api.patientReport.findMany({
          where: {
            AND: [
              user.role === UserRole.Admin
                ? {}
                : user.role === UserRole.Manager
                  ? { report: { clinic: { managerId: user.id } } }
                  : { report: { patientId: user.id } },
              patient ? { report: { patientId: patient.userId } } : {},
            ],
          },
          orderBy: { report: { createdAt: 'desc' } },
          ...pagination,
        })
      }
      loadKey={patient ? String(patient.userId) : ''}
      filters={
        user.role !== UserRole.User ? (
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
        ) : undefined
      }
      getRowId={(report) => String(report.reportId)}
      rowAction={(report) =>
        access.patientReports.read({
          managerId: report.report.clinic.managerId,
          patientId: report.report.patientId,
        }) ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Download patient report PDF"
            disabled={downloadRequest.isLoading}
            onClick={() =>
              void downloadRequest.fetch(report).catch(() => undefined)
            }
          >
            <DownloadIcon />
          </Button>
        ) : null
      }
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
      canDelete={(report) =>
        access.patientReports.delete({
          managerId: report.report.clinic.managerId,
        })
      }
      deleteAction={(report) => api.patientReport.del(report.reportId)}
    />
  );
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
