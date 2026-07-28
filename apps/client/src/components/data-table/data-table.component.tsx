import {
  type ColumnDef,
  type Row,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
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
};

export const DataTable = <Data,>({
  columns,
  data,
  getRowId,
  enableRowSelection,
  onSelectionChange,
  onRowClick,
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
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: (row) => enableRowSelection?.(row.original) ?? false,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    initialState: {
      pagination: {
        pageSize: 10,
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
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                className={onRowClick ? 'cursor-pointer' : undefined}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
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
              onClick={() => table.previousPage()}
            >
              <ChevronLeftIcon />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
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

export const stopRowAction = (event: React.MouseEvent) =>
  event.stopPropagation();

export type DataTableRow<Data> = Row<Data>;
