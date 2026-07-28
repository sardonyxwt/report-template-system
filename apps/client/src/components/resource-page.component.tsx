import { type ColumnDef } from '@tanstack/react-table';
import { PlusIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';
import { useRequest } from '../hooks/request.hook';
import { getErrorMessage } from '../utils/request.utils';
import { DataTable } from './data-table/data-table.component';
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
import { Skeleton } from './shadcn/ui/skeleton';

type ResourcePageProps<Data> = {
  title: string;
  description: string;
  itemName: string;
  columns: ColumnDef<Data>[];
  load: () => Promise<Data[]>;
  getRowId: (row: Data) => string;
  createAction?: (reload: () => void, trigger: ReactNode) => ReactNode;
  rowAction?: (row: Data, reload: () => void) => ReactNode;
  canDelete?: (row: Data) => boolean;
  deleteAction?: (row: Data) => Promise<unknown>;
  onRowClick?: (row: Data) => void;
};

export const ResourcePage = <Data,>({
  title,
  description,
  itemName,
  columns,
  load,
  getRowId,
  createAction,
  rowAction,
  canDelete,
  deleteAction,
  onRowClick,
}: ResourcePageProps<Data>) => {
  const [selected, setSelected] = useState<Data[]>([]);
  const loadRequest = useRequest(load, {
    onError: (error) => toast.error(getErrorMessage(error)),
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
  const reload = useCallback(() => {
    void loadRequest.reload();
  }, [loadRequest]);

  useEffect(() => {
    void loadRequest.fetch().catch(() => undefined);
  }, [loadRequest.fetch]);

  const data = useMemo(() => loadRequest.data ?? [], [loadRequest.data]);
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
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
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
                      void deleteRequest.fetch(selected).catch(() => undefined)
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
            <Button>
              <PlusIcon />
              Create
            </Button>,
          )}
        </div>
      </div>

      {loadRequest.isLoading && !loadRequest.data ? (
        <TableSkeleton />
      ) : data.length ? (
        <DataTable
          columns={tableColumns}
          data={data}
          getRowId={getRowId}
          enableRowSelection={canDelete}
          onSelectionChange={setSelected}
          onRowClick={onRowClick}
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
  );
};

const TableSkeleton = () => (
  <div className="space-y-3 rounded-xl border bg-card p-4">
    {Array.from({ length: 7 }).map((_, index) => (
      <Skeleton key={index} className="h-10 w-full" />
    ))}
  </div>
);
