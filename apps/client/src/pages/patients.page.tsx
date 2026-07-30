import { type ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { type PatientResponse } from 'platform/common-base';
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
import { loadClinics } from '../utils/reference-loaders.utils';
import { managedViaClinicWhere } from '../utils/scope.utils';

const columns: ColumnDef<PatientResponse>[] = [
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
];

export const PatientsPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const [search, setSearch] = useState('');
  const [clinic, setClinic] =
    useState<Awaited<ReturnType<typeof loadClinics>>[number]>();

  return (
    <ResourcePage
      title="Patients"
      itemName="patient"
      columns={columns}
      load={(pagination) => {
        const searchWhere = search
          ? {
              user: {
                OR: [
                  { fullName: searchQueryOrUndef(search) },
                  { email: searchQueryOrUndef(search) },
                ],
              },
            }
          : {};

        return api.patient.findMany({
          where: {
            AND: [
              managedViaClinicWhere(user),
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
            load={(clinicSearch) => loadClinics(user, clinicSearch)}
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
