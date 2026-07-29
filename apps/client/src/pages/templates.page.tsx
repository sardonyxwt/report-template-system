import { type ColumnDef } from '@tanstack/react-table';
import { PencilIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  type ClinicResponse,
  type TemplateResponse,
  REFERENCE_ITEMS_LIMIT,
} from 'platform/common-base';
import { searchQueryOrUndef, UserRole } from 'platform/prisma';
import { api } from '../api/client.api';
import { TemplateModal } from '../components/modal/template.modal';
import {
  AsyncAutocompleteFilter,
  ResourceSearchInput,
} from '../components/resource-filters.component';
import { ResourcePage } from '../components/resource-page.component';
import { Button } from '../components/shadcn/ui/button';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuthenticatedUser } from '../providers/auth.provider';

export const TemplatesPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const [search, setSearch] = useState('');
  const [clinic, setClinic] = useState<ClinicResponse>();
  const loadClinics = useCallback(
    async (clinicSearch: string) => {
      const response = await api.clinic.findMany({
        where: {
          AND: [
            user.role === UserRole.Admin ? {} : { managerId: user.id },
            clinicSearch
              ? {
                  name: searchQueryOrUndef(clinicSearch),
                }
              : {},
          ],
        },
        orderBy: { name: 'asc' },
        take: REFERENCE_ITEMS_LIMIT,
      });
      return response.items;
    },
    [user.id, user.role],
  );
  const columns = useMemo<ColumnDef<TemplateResponse>[]>(
    () => [
      { accessorKey: 'name', header: 'Template' },
      {
        id: 'clinic',
        header: 'Clinic',
        cell: ({ row }) => row.original.clinic.name,
      },
    ],
    [],
  );

  return (
    <ResourcePage
      title="Templates"
      itemName="template"
      columns={columns}
      load={(pagination) =>
        api.template.findMany({
          where: {
            AND: [
              user.role === UserRole.Admin
                ? {}
                : { clinic: { managerId: user.id } },
              search
                ? {
                    name: searchQueryOrUndef(search),
                  }
                : {},
              clinic ? { clinicId: clinic.id } : {},
            ],
          },
          orderBy: { name: 'asc' },
          ...pagination,
        })
      }
      loadKey={`${search}|${clinic?.id ?? ''}`}
      filters={
        <>
          <ResourceSearchInput
            value={search}
            placeholder="Search templates by name"
            onChange={setSearch}
          />
          <AsyncAutocompleteFilter
            value={clinic}
            placeholder="Search clinic"
            emptyLabel="No clinics found."
            load={loadClinics}
            getKey={(option) => String(option.id)}
            getLabel={(option) => option.name}
            onChange={setClinic}
          />
        </>
      }
      getRowId={(template) => String(template.id)}
      createAction={
        access.templates.create({ managerId: user.id })
          ? (reload, trigger) => (
              <TemplateModal trigger={trigger} onSaved={reload} />
            )
          : undefined
      }
      rowAction={(template, reload) =>
        access.templates.update({ managerId: user.id }) ? (
          <TemplateModal
            template={template}
            onSaved={reload}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Edit template">
                <PencilIcon />
              </Button>
            }
          />
        ) : null
      }
      canDelete={() => access.templates.delete({ managerId: user.id })}
      deleteAction={(template) => api.template.del(template.id)}
    />
  );
};
