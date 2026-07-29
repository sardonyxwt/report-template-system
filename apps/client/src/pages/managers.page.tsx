import { type ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { type UserResponse } from 'platform/common-base';
import { searchQueryOrUndef, UserRole } from 'platform/prisma';
import { api } from '../api/client.api';
import { ManagerModal } from '../components/modal/manager.modal';
import { ResourceSearchInput } from '../components/resource-filters.component';
import { ResourcePage } from '../components/resource-page.component';
import { Badge } from '../components/shadcn/ui/badge';
import { useAccessControl } from '../providers/access-control.provider';

export const ManagersPage = () => {
  const access = useAccessControl();
  const [search, setSearch] = useState('');
  const columns = useMemo<ColumnDef<UserResponse>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Manager',
        cell: ({ row }) => row.original.fullName || '—',
      },
      { accessorKey: 'email', header: 'Email' },
      {
        id: 'clinics',
        header: 'Manager profile',
        cell: ({ row }) => (
          <Badge variant={row.original.manager ? 'default' : 'destructive'}>
            {row.original.manager ? 'Active' : 'Missing'}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <ResourcePage
      title="Managers"
      description="Promote existing users and manage clinic ownership roles."
      itemName="manager"
      columns={columns}
      load={(pagination) =>
        api.user.findMany({
          where: {
            role: UserRole.Manager,
            ...(search
              ? {
                  OR: [
                    {
                      fullName: searchQueryOrUndef(search),
                    },
                    {
                      email: searchQueryOrUndef(search),
                    },
                  ],
                }
              : {}),
          },
          orderBy: { email: 'asc' },
          ...pagination,
        })
      }
      loadKey={search}
      filters={
        <ResourceSearchInput
          value={search}
          placeholder="Search managers by name or email"
          onChange={setSearch}
        />
      }
      getRowId={(user) => String(user.id)}
      createAction={
        access.managers.create()
          ? (reload, trigger) => (
              <ManagerModal trigger={trigger} onSaved={reload} />
            )
          : undefined
      }
      canDelete={() => access.managers.delete()}
      deleteAction={(manager) => api.manager.del(manager.id)}
    />
  );
};
