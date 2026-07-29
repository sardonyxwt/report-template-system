import { type ColumnDef } from '@tanstack/react-table';
import { PencilIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  type ClinicResponse,
  REFERENCE_ITEMS_LIMIT,
  type UserResponse,
} from 'platform/common-base';
import { searchQueryOrUndef, UserRole } from 'platform/prisma';
import { api } from '../api/client.api';
import { Can } from '../components/can.component';
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

export const ClinicsPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const [search, setSearch] = useState('');
  const [manager, setManager] = useState<UserResponse>();
  const loadManagers = useCallback(
    async (managerSearch: string) => {
      if (user.role !== UserRole.Admin) {
        return [user];
      }

      const response = await api.user.findMany({
        where: {
          role: UserRole.Manager,
          ...(managerSearch
            ? {
                OR: [
                  {
                    fullName: searchQueryOrUndef(managerSearch),
                  },
                  {
                    email: searchQueryOrUndef(managerSearch),
                  },
                ],
              }
            : {}),
        },
        orderBy: { email: 'asc' },
        take: REFERENCE_ITEMS_LIMIT,
      });
      return response.items;
    },
    [user],
  );
  const columns = useMemo<ColumnDef<ClinicResponse>[]>(
    () => [
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
    ],
    [],
  );

  return (
    <ResourcePage
      title="Clinics"
      description="Manage clinics and the managers responsible for them."
      itemName="clinic"
      columns={columns}
      load={(pagination) =>
        api.clinic.findMany({
          where: {
            AND: [
              user.role === UserRole.Admin ? {} : { managerId: user.id },
              search
                ? {
                    name: searchQueryOrUndef(search),
                  }
                : {},
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
            load={loadManagers}
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
              <Button variant="ghost" size="icon-sm" aria-label="Edit clinic">
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
