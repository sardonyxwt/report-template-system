import { type ColumnDef } from '@tanstack/react-table';
import { PencilIcon } from 'lucide-react';
import { type TemplateResponse } from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { useMemo } from 'react';
import { api } from '../api/client.api';
import { Can } from '../components/can.component';
import { TemplateModal } from '../components/modal/template.modal';
import { ResourcePage } from '../components/resource-page.component';
import { Button } from '../components/shadcn/ui/button';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuthenticatedUser } from '../providers/auth.provider';

export const TemplatesPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const columns = useMemo<ColumnDef<TemplateResponse>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Template' },
      { accessorKey: 'clinicId', header: 'Clinic ID' },
      {
        id: 'blocks',
        header: 'Blocks',
        cell: ({ row }) => row.original.data.blocks.length,
      },
    ],
    [],
  );

  return (
    <ResourcePage
      title="Templates"
      description="Create reusable, clinic-specific report structures."
      itemName="template"
      columns={columns}
      load={async () => {
        const response = await api.template.findMany({
          where:
            user.role === UserRole.Admin
              ? {}
              : { clinic: { managerId: user.id } },
          orderBy: { name: 'asc' },
          take: 250,
        });
        return response.items;
      }}
      getRowId={(template) => String(template.id)}
      createAction={
        access.templates.create({ managerId: user.id })
          ? (reload, trigger) => (
              <TemplateModal trigger={trigger} onSaved={reload} />
            )
          : undefined
      }
      rowAction={(template, reload) => (
        <Can granted={access.templates.update({ managerId: user.id })}>
          <TemplateModal
            template={template}
            onSaved={reload}
            trigger={
              <Button variant="ghost" size="icon" aria-label="Edit template">
                <PencilIcon />
              </Button>
            }
          />
        </Can>
      )}
      canDelete={() => access.templates.delete({ managerId: user.id })}
      deleteAction={(template) => api.template.del(template.id)}
    />
  );
};
