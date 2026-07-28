import { type ColumnDef } from '@tanstack/react-table';
import { type UserResponse } from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { useMemo } from 'react';
import { api } from '../api/client.api';
import { ManagerModal } from '../components/modal/manager.modal';
import { ResourcePage } from '../components/resource-page.component';
import { Badge } from '../components/shadcn/ui/badge';
import { useAccessControl } from '../providers/access-control.provider';

export const ManagersPage = () => {
  const access = useAccessControl();
  const columns = useMemo<ColumnDef<UserResponse>[]>(
    () => [
      { accessorKey: 'id', header: 'User ID' },
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
      load={async () => {
        const response = await api.user.findMany({
          where: { role: UserRole.Manager },
          orderBy: { email: 'asc' },
          take: 250,
        });
        return response.items;
      }}
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
