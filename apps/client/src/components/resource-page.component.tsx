import { type ColumnDef } from '@tanstack/react-table';
import { PlusIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react';
import { type ReactNode, useMemo } from 'react';
import { toast } from 'sonner';
import { TABLE_PAGE_SIZE } from 'platform/common-base';
import { useRequest } from '../hooks/request.hook';
import {
  type ResourcePageLoad,
  useResourcePageData,
} from '../hooks/resource-page.hook';
import { getErrorMessage } from '../utils/request.utils';
import { DataTable } from './data-table/data-table.component';
import { PageToolbar } from './layout/page-toolbar.component';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './shadcn/ui/alert-dialog';
import { Button } from './shadcn/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './shadcn/ui/empty';
import { Spinner } from './shadcn/ui/spinner';

type ResourcePageProps<Data> = {
  title: string;
  itemName: string;
  columns: ColumnDef<Data>[];
  load: ResourcePageLoad<Data>;
  getRowId: (row: Data) => string;
  createAction?: (reload: () => void, trigger: ReactNode) => ReactNode;
  rowAction?: (row: Data, reload: () => void) => ReactNode;
  canDelete?: (row: Data) => boolean;
  deleteAction?: (row: Data) => Promise<unknown>;
  onRowClick?: (row: Data) => void;
  filters?: ReactNode;
  loadKey?: string;
};

export const ResourcePage = <Data,>({
  title,
  itemName,
  columns,
  load,
  getRowId,
  createAction,
  rowAction,
  canDelete,
  deleteAction,
  onRowClick,
  filters,
  loadKey = '',
}: ResourcePageProps<Data>) => {
  const {
    changePage,
    data,
    loading,
    loadRequest,
    pageCount,
    pageIndex,
    reload,
    selected,
    setSelected,
  } = useResourcePageData({
    load,
    loadKey,
  });
  const deleteRequest = useRequest(
    async (rows: Data[]) => {
      if (!deleteAction) {
        return;
      }
      await Promise.all(rows.map(deleteAction));
    },
    {
      onSuccess: () => {
        toast.success(
          `${selected.length} ${itemName}${selected.length === 1 ? '' : 's'} deleted.`,
        );
        setSelected([]);
        void loadRequest.reload();
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    },
  );
  const tableColumns = useMemo<ColumnDef<Data>[]>(
    () =>
      rowAction
        ? [
            ...columns,
            {
              id: 'actions',
              header: () => <span className="sr-only">Actions</span>,
              cell: ({ row }) => (
                <div
                  className="flex justify-end"
                  onClick={(event) => event.stopPropagation()}
                >
                  {rowAction(row.original, reload)}
                </div>
              ),
            },
          ]
        : columns,
    [columns, reload, rowAction],
  );

  return (
    <div className="flex min-h-full flex-col">
      <PageToolbar
        title={title}
        actions={
          <>
            {selected.length > 0 && deleteAction && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2Icon />
                    Delete ({selected.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete selected {itemName}s?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Related records may also be
                      removed by the server.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={deleteRequest.isLoading}
                      onClick={() =>
                        void deleteRequest
                          .fetch(selected)
                          .catch(() => undefined)
                      }
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              variant="outline"
              size="icon"
              aria-label={`Refresh ${title}`}
              disabled={loadRequest.isLoading}
              onClick={() => void loadRequest.reload()}
            >
              <RefreshCwIcon
                className={loadRequest.isLoading ? 'animate-spin' : undefined}
              />
            </Button>
            {createAction?.(
              reload,
              <Button
                aria-label={`Create ${itemName}`}
                className="max-sm:size-8 max-sm:px-0"
              >
                <PlusIcon />
                <span className="hidden sm:inline">Create</span>
              </Button>,
            )}
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-6 p-4 md:p-6">
        {filters && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {filters}
          </div>
        )}

        <div
          className="relative flex min-h-0 flex-1 flex-col"
          aria-busy={loading}
        >
          <div
            className={`flex min-h-0 flex-1 flex-col transition-opacity duration-200 ease-in-out ${
              loading ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            aria-hidden={loading}
            inert={loading}
          >
            {data.length ? (
              <DataTable
                columns={tableColumns}
                data={data}
                getRowId={getRowId}
                enableRowSelection={canDelete}
                onSelectionChange={setSelected}
                onRowClick={onRowClick}
                pageIndex={pageIndex}
                pageSize={TABLE_PAGE_SIZE}
                pageCount={pageCount}
                onPageChange={changePage}
              />
            ) : (
              <Empty className="min-h-80 rounded-xl border bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PlusIcon />
                  </EmptyMedia>
                  <EmptyTitle>No {title.toLowerCase()} yet</EmptyTitle>
                  <EmptyDescription>
                    Create the first {itemName} or refresh after data is added.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>

          <div
            className={`absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background transition-opacity duration-200 ease-in-out ${
              loading
                ? 'cursor-wait opacity-100'
                : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!loading}
          >
            <div role="status" className="flex items-center justify-center">
              <Spinner className="size-6 text-muted-foreground" />
              <span className="sr-only">Loading {title.toLowerCase()}…</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
