import { type ColumnDef } from '@tanstack/react-table';
import { PencilIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { type UserResponse } from 'platform/common-base';
import { searchQueryOrUndef } from 'platform/prisma';
import { api } from '../api/client.api';
import { UserModal } from '../components/modal/user.modal';
import { ResourceSearchInput } from '../components/resource-filters.component';
import { ResourcePage } from '../components/resource-page.component';
import { Badge } from '../components/shadcn/ui/badge';
import { Button } from '../components/shadcn/ui/button';
import { useAccessControl } from '../providers/access-control.provider';

export const UsersPage = () => {
  const access = useAccessControl();
  const [search, setSearch] = useState('');
  const columns = useMemo<ColumnDef<UserResponse>[]>(
    () => [
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
      itemName="user"
      columns={columns}
      load={(pagination) =>
        api.user.findMany({
          where: search
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
            : {},
          orderBy: { email: 'asc' },
          ...pagination,
        })
      }
      loadKey={search}
      filters={
        <ResourceSearchInput
          value={search}
          placeholder="Search users by name or email"
          onChange={setSearch}
        />
      }
      getRowId={(user) => String(user.id)}
      createAction={
        access.users.create()
          ? (reload, trigger) => (
              <UserModal trigger={trigger} onSaved={reload} />
            )
          : undefined
      }
      rowAction={(user, reload) =>
        access.users.update({ user }) ? (
          <UserModal
            user={user}
            onSaved={reload}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Edit user">
                <PencilIcon />
              </Button>
            }
          />
        ) : null
      }
      canDelete={(user) => access.users.delete({ role: user.role })}
      deleteAction={(user) => api.user.del(user.id)}
    />
  );
};
