import { type ColumnDef } from '@tanstack/react-table';
import { PencilIcon } from 'lucide-react';
import { type UserResponse } from 'platform/common-base';
import { useMemo } from 'react';
import { api } from '../api/client.api';
import { Can } from '../components/can.component';
import { UserModal } from '../components/modal/user.modal';
import { ResourcePage } from '../components/resource-page.component';
import { Badge } from '../components/shadcn/ui/badge';
import { Button } from '../components/shadcn/ui/button';
import { useAccessControl } from '../providers/access-control.provider';

export const UsersPage = () => {
  const access = useAccessControl();
  const columns = useMemo<ColumnDef<UserResponse>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      {
        accessorKey: 'fullName',
        header: 'Name',
        cell: ({ row }) => row.original.fullName || '—',
      },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.role.toLowerCase()}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <ResourcePage
      title="Users"
      description="Manage platform identities and public account information."
      itemName="user"
      columns={columns}
      load={async () => {
        const response = await api.user.findMany({
          where: {},
          orderBy: { email: 'asc' },
        });
        return response.items;
      }}
      getRowId={(user) => String(user.id)}
      createAction={
        access.users.create()
          ? (reload, trigger) => (
              <UserModal trigger={trigger} onSaved={reload} />
            )
          : undefined
      }
      rowAction={(user, reload) => (
        <Can granted={access.users.update({ user })}>
          <UserModal
            user={user}
            onSaved={reload}
            trigger={
              <Button variant="ghost" size="icon" aria-label="Edit user">
                <PencilIcon />
              </Button>
            }
          />
        </Can>
      )}
      canDelete={(user) => access.users.delete({ role: user.role })}
      deleteAction={(user) => api.user.del(user.id)}
    />
  );
};
