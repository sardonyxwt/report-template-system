import { type ColumnDef } from '@tanstack/react-table';
import { type PatientResponse } from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { useMemo } from 'react';
import { api } from '../api/client.api';
import { PatientModal } from '../components/modal/patient.modal';
import { ResourcePage } from '../components/resource-page.component';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuthenticatedUser } from '../providers/auth.provider';

export const PatientsPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const columns = useMemo<ColumnDef<PatientResponse>[]>(
    () => [
      { accessorKey: 'userId', header: 'User ID' },
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
      { accessorKey: 'clinicId', header: 'Clinic ID' },
    ],
    [],
  );

  return (
    <ResourcePage
      title="Patients"
      description="View patients assigned to the clinics you can manage."
      itemName="patient"
      columns={columns}
      load={async () => {
        const response = await api.patient.findMany({
          where:
            user.role === UserRole.Admin
              ? {}
              : { clinic: { managerId: user.id } },
          orderBy: { userId: 'asc' },
          take: 500,
        });
        return response.items;
      }}
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
    />
  );
};
