import { type ColumnDef } from '@tanstack/react-table';
import { PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { type ClinicResponse } from 'platform/common-base';
import { searchQueryOrUndef } from 'platform/prisma';
import { api } from '../api/client.api';
import { ClinicModal } from '../components/modal/clinic.modal';
import {
  AsyncAutocompleteFilter,
  ResourceSearchInput,
} from '../components/resource-filters.component';
import { ResourcePage } from '../components/resource-page.component';
import { Button } from '../components/shadcn/ui/button';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuthenticatedUser } from '../providers/auth.provider';
import { formatOptionLabel } from '../utils/formatting.utils';
import { loadManagers } from '../utils/reference-loaders.utils';
import { managedClinicWhere } from '../utils/scope.utils';

const columns: ColumnDef<ClinicResponse>[] = [
  { accessorKey: 'name', header: 'Clinic' },
  {
    id: 'manager',
    header: 'Manager',
    cell: ({ row }) =>
      formatOptionLabel(
        row.original.manager.user.fullName,
        row.original.manager.user.email,
      ),
  },
];

export const ClinicsPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const [search, setSearch] = useState('');
  const [manager, setManager] =
    useState<Awaited<ReturnType<typeof loadManagers>>[number]>();

  return (
    <ResourcePage
      title="Clinics"
      itemName="clinic"
      columns={columns}
      load={(pagination) =>
        api.clinic.findMany({
          where: {
            AND: [
              managedClinicWhere(user),
              search ? { name: searchQueryOrUndef(search) } : {},
              manager ? { managerId: manager.id } : {},
            ],
          },
          orderBy: { name: 'asc' },
          ...pagination,
        })
      }
      loadKey={`${search}|${manager?.id ?? ''}`}
      filters={
        <>
          <ResourceSearchInput
            value={search}
            placeholder="Search clinics by name"
            onChange={setSearch}
          />
          <AsyncAutocompleteFilter
            value={manager}
            placeholder="Search manager"
            emptyLabel="No managers found."
            load={(managerSearch) => loadManagers(user, managerSearch)}
            getKey={(option) => String(option.id)}
            getLabel={(option) =>
              formatOptionLabel(option.fullName, option.email)
            }
            onChange={setManager}
          />
        </>
      }
      getRowId={(clinic) => String(clinic.id)}
      createAction={
        access.clinics.create({ managerId: user.id })
          ? (reload, trigger) => (
              <ClinicModal trigger={trigger} onSaved={reload} />
            )
          : undefined
      }
      rowAction={(clinic, reload) =>
        access.clinics.update({
          clinic,
          updates: clinic,
        }) ? (
          <ClinicModal
            clinic={clinic}
            onSaved={reload}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Edit clinic">
                <PencilIcon />
              </Button>
            }
          />
        ) : null
      }
      canDelete={(clinic) =>
        access.clinics.delete({ managerId: clinic.managerId })
      }
      deleteAction={(clinic) => api.clinic.del(clinic.id)}
    />
  );
};
