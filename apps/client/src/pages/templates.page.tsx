import { type ColumnDef } from '@tanstack/react-table';
import { PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { type TemplateResponse } from 'platform/common-base';
import { searchQueryOrUndef } from 'platform/prisma';
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
import { loadClinics } from '../utils/reference-loaders.utils';
import { managedViaClinicWhere } from '../utils/scope.utils';

const columns: ColumnDef<TemplateResponse>[] = [
  { accessorKey: 'name', header: 'Template' },
  {
    id: 'clinic',
    header: 'Clinic',
    cell: ({ row }) => row.original.clinic.name,
  },
];

export const TemplatesPage = () => {
  const access = useAccessControl();
  const user = useAuthenticatedUser();
  const [search, setSearch] = useState('');
  const [clinic, setClinic] =
    useState<Awaited<ReturnType<typeof loadClinics>>[number]>();

  return (
    <ResourcePage
      title="Templates"
      itemName="template"
      columns={columns}
      load={(pagination) =>
        api.template.findMany({
          where: {
            AND: [
              managedViaClinicWhere(user),
              search ? { name: searchQueryOrUndef(search) } : {},
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
            load={(clinicSearch) => loadClinics(user, clinicSearch)}
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
