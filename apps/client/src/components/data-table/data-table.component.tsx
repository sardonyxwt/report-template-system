import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../shadcn/ui/button';
import { Checkbox } from '../shadcn/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../shadcn/ui/table';

export type DataTableProps<Data> = {
  columns: ColumnDef<Data>[];
  data: Data[];
  getRowId: (row: Data) => string;
  enableRowSelection?: (row: Data) => boolean;
  onSelectionChange?: (rows: Data[]) => void;
  onRowClick?: (row: Data) => void;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
};

export const DataTable = <Data,>({
  columns,
  data,
  getRowId,
  enableRowSelection,
  onSelectionChange,
  onRowClick,
  pageIndex,
  pageSize,
  pageCount,
  onPageChange,
}: DataTableProps<Data>) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const selectable = !!enableRowSelection;
  const tableColumns = useMemo(
    () => (selectable ? [createSelectionColumn<Data>(), ...columns] : columns),
    [columns, selectable],
  );
  const table = useReactTable({
    columns: tableColumns,
    data,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
    enableRowSelection: (row) => enableRowSelection?.(row.original) ?? false,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  });

  useEffect(() => {
    setRowSelection({});
  }, [data]);

  useEffect(() => {
    onSelectionChange?.(
      table.getSelectedRowModel().rows.map((row) => row.original),
    );
  }, [onSelectionChange, rowSelection, table]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => (
                  <TableHead
                    key={header.id}
                    className={getUtilityColumnClassName(
                      header.column.id,
                      index,
                      selectable,
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                className={onRowClick ? 'h-9 cursor-pointer' : 'h-9'}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <TableCell
                    key={cell.id}
                    className={`h-9 py-1 ${getUtilityColumnClassName(
                      cell.column.id,
                      index,
                      selectable,
                    )}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => onPageChange(pageIndex - 1)}
            >
              <ChevronLeftIcon />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => onPageChange(pageIndex + 1)}
            >
              Next
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const createSelectionColumn = <Data,>(): ColumnDef<Data> => ({
  id: 'select',
  header: ({ table }) => (
    <Checkbox
      aria-label="Select all"
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && 'indeterminate')
      }
      onCheckedChange={(checked) =>
        table.toggleAllPageRowsSelected(Boolean(checked))
      }
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      aria-label="Select row"
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onClick={(event) => event.stopPropagation()}
      onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
    />
  ),
  enableHiding: false,
  enableSorting: false,
});

const getUtilityColumnClassName = (
  columnId: string,
  columnIndex: number,
  selectable: boolean,
) => {
  if (columnId === 'select') {
    return 'w-8 min-w-8 max-w-8 pr-0';
  }

  if (columnId === 'actions' || columnId === 'open') {
    return 'w-9 min-w-9 max-w-9 px-1';
  }

  if (selectable && columnIndex === 1) {
    return 'pl-1';
  }

  return '';
};
