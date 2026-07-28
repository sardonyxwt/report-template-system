import { type ColumnDef } from '@tanstack/react-table';
import { PencilIcon } from 'lucide-react';
import { type ClinicResponse } from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { useMemo } from 'react';
import { api } from '../api/client.api';
import { Can } from '../components/can.component';
import { ClinicModal } from '../components/modal/clinic.modal';
import { ResourcePage } from '../components/resource-page.component';
import { Button } from '../components/shadcn/ui/button';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuthenticatedUser } from '../providers/auth.provider';

export const ClinicsPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const columns = useMemo<ColumnDef<ClinicResponse>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Clinic' },
      { accessorKey: 'managerId', header: 'Manager ID' },
    ],
    [],
  );

  return (
    <ResourcePage
      title="Clinics"
      description="Manage clinics and the managers responsible for them."
      itemName="clinic"
      columns={columns}
      load={async () => {
        const response = await api.clinic.findMany({
          where: user.role === UserRole.Admin ? {} : { managerId: user.id },
          orderBy: { name: 'asc' },
          take: 250,
        });
        return response.items;
      }}
      getRowId={(clinic) => String(clinic.id)}
      createAction={
        access.clinics.create({ managerId: user.id })
          ? (reload, trigger) => (
              <ClinicModal trigger={trigger} onSaved={reload} />
            )
          : undefined
      }
      rowAction={(clinic, reload) => (
        <Can
          granted={access.clinics.update({
            clinic,
            updates: clinic,
          })}
        >
          <ClinicModal
            clinic={clinic}
            onSaved={reload}
            trigger={
              <Button variant="ghost" size="icon" aria-label="Edit clinic">
                <PencilIcon />
              </Button>
            }
          />
        </Can>
      )}
      canDelete={(clinic) =>
        access.clinics.delete({ managerId: clinic.managerId })
      }
      deleteAction={(clinic) => api.clinic.del(clinic.id)}
    />
  );
};
