import { type ColumnDef } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import {
  type ClinicResponse,
  type PatientResponse,
  REFERENCE_ITEMS_LIMIT,
} from 'platform/common-base';
import { searchQueryOrUndef, UserRole } from 'platform/prisma';
import { api } from '../api/client.api';
import { PatientModal } from '../components/modal/patient.modal';
import {
  AsyncAutocompleteFilter,
  ResourceSearchInput,
} from '../components/resource-filters.component';
import { ResourcePage } from '../components/resource-page.component';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuthenticatedUser } from '../providers/auth.provider';

export const PatientsPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const [search, setSearch] = useState('');
  const [clinic, setClinic] = useState<ClinicResponse>();
  const loadClinics = useCallback(
    async (clinicSearch: string) => {
      const response = await api.clinic.findMany({
        where: {
          AND: [
            user.role === UserRole.Admin ? {} : { managerId: user.id },
            clinicSearch
              ? {
                  name: searchQueryOrUndef(clinicSearch),
                }
              : {},
          ],
        },
        orderBy: { name: 'asc' },
        take: REFERENCE_ITEMS_LIMIT,
      });
      return response.items;
    },
    [user.id, user.role],
  );
  const columns = useMemo<ColumnDef<PatientResponse>[]>(
    () => [
      {
        id: 'name',
        header: 'Patient',
        cell: ({ row }) => row.original.user.fullName || '—',
      },
      {
        id: 'email',
        header: 'Email',
        cell: ({ row }) => row.original.user.email,
      },
      {
        id: 'clinic',
        header: 'Clinic',
        cell: ({ row }) => row.original.clinic.name,
      },
    ],
    [],
  );

  return (
    <ResourcePage
      title="Patients"
      description="View patients assigned to the clinics you can manage."
      itemName="patient"
      columns={columns}
      load={(pagination) => {
        const accessWhere =
          user.role === UserRole.Admin
            ? {}
            : { clinic: { managerId: user.id } };
        const searchWhere = search
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
          : {};

        return api.patient.findMany({
          where: {
            AND: [
              accessWhere,
              searchWhere,
              clinic ? { clinicId: clinic.id } : {},
            ],
          },
          orderBy: { userId: 'asc' },
          ...pagination,
        });
      }}
      loadKey={`${search}|${clinic?.id ?? ''}`}
      filters={
        <>
          <ResourceSearchInput
            value={search}
            placeholder="Search by name or email"
            onChange={setSearch}
          />
          <AsyncAutocompleteFilter
            value={clinic}
            placeholder="Search clinic"
            emptyLabel="No clinics found."
            load={loadClinics}
            getKey={(option) => String(option.id)}
            getLabel={(option) => option.name}
            onChange={setClinic}
          />
        </>
      }
      getRowId={(patient) => String(patient.userId)}
      createAction={
        access.patients.create({
          managerId: user.id,
          userRole: UserRole.User,
          isAssigned: false,
        })
          ? (reload, trigger) => (
              <PatientModal trigger={trigger} onSaved={reload} />
            )
          : undefined
      }
      canDelete={(patient) =>
        access.patients.delete({
          managerId: patient.clinic.managerId,
        })
      }
      deleteAction={(patient) => api.patient.del(patient.userId)}
    />
  );
};
