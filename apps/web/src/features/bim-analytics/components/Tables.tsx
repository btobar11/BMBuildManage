import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table';
import { Card, CardContent } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../utils/cn';

const columnHelper = createColumnHelper<Record<string, unknown>>();

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  loading?: boolean;
  pageSize?: number;
  className?: string;
  onRowClick?: (row: T) => void;
}

function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  pageSize = 10,
  className,
  onRowClick,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {header.isPlaceholder ? null : (
                          <Skeleton className="h-4 w-20" />
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
                        header.column.getCanSort() && 'cursor-pointer select-none hover:bg-muted/70'
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="ml-1">
                            {{
                              asc: <ChevronUp size={14} />,
                              desc: <ChevronDown size={14} />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ChevronsUpDown size={14} className="opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-muted/50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Página {table.getState().pagination.pageIndex + 1} de{' '}
                {table.getPageCount()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CostAnalysisTableProps {
  data: Array<{
    ifcType: string;
    totalCost: number;
    totalVolume: number;
    costPerM3: number;
    executionProgress: number;
  }>;
  loading?: boolean;
}

export function CostAnalysisTable({ data, loading }: CostAnalysisTableProps) {
  const columns = React.useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(
    () => [
      columnHelper.accessor('ifcType', {
        header: 'Tipo IFC',
        cell: (info) => (info.getValue() as string)?.replace('Ifc', '') || '-',
      }),
      columnHelper.accessor('totalVolume', {
        header: 'Volumen (m³)',
        cell: (info) => {
          const val = info.getValue() as number;
          return val ? val.toLocaleString('es-CL', { maximumFractionDigits: 2 }) : '0';
        },
      }),
      columnHelper.accessor('totalCost', {
        header: 'Costo Total',
        cell: (info) => {
          const val = info.getValue() as number;
          return val ? `$${val.toLocaleString('es-CL')}` : '$0';
        },
      }),
      columnHelper.accessor('costPerM3', {
        header: 'Costo/m³',
        cell: (info) => {
          const val = info.getValue() as number;
          return val ? `$${val.toLocaleString('es-CL')}` : '$0';
        },
      }),
      columnHelper.accessor('executionProgress', {
        header: 'Avance',
        cell: (info) => {
          const val = info.getValue() as number;
          return (
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    val >= 90
                      ? 'bg-success-500'
                      : val >= 70
                        ? 'bg-primary-500'
                        : val >= 50
                          ? 'bg-warning-500'
                          : 'bg-danger-500'
                  )}
                  style={{ width: `${Math.min(val, 100)}%` }}
                />
              </div>
              <span className="text-xs">{val?.toFixed(1) || '0'}%</span>
            </div>
          );
        },
      }),
    ],
    []
  );

  return (
    <DataTable
      data={data as unknown as Record<string, unknown>[]}
      columns={columns}
      loading={loading}
      pageSize={8}
    />
  );
}

interface ClashTableProps {
  data: Array<{
    id: string;
    severity: string;
    clash_type: string;
    status: string;
    discipline_a: string;
    discipline_b: string;
    detected_at: string;
  }>;
  loading?: boolean;
}

export function ClashTable({ data, loading }: ClashTableProps) {
  const columns = React.useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(
    () => [
      columnHelper.accessor('severity', {
        header: 'Severidad',
        cell: (info) => {
          const severity = info.getValue() as string;
          return (
            <span
              className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                severity === 'critical'
                  ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
                  : severity === 'high'
                    ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                    : severity === 'medium'
                      ? 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-400'
                      : 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
              )}
            >
              {severity === 'critical'
                ? 'Crítico'
                : severity === 'high'
                  ? 'Alto'
                  : severity === 'medium'
                    ? 'Medio'
                    : 'Bajo'}
            </span>
          );
        },
      }),
      columnHelper.accessor('clash_type', {
        header: 'Tipo',
        cell: (info) => {
          const type = info.getValue() as string;
          return type === 'hard'
            ? 'Duro'
            : type === 'soft'
              ? 'Suavio'
              : 'Clearance';
        },
      }),
      columnHelper.accessor('discipline_a', {
        header: 'Disciplina A',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('discipline_b', {
        header: 'Disciplina B',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span
              className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                status === 'resolved'
                  ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                  : status === 'ignored'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
              )}
            >
              {status === 'resolved'
                ? 'Resuelto'
                : status === 'ignored'
                  ? 'Ignorado'
                  : 'Pendiente'}
            </span>
          );
        },
      }),
      columnHelper.accessor('detected_at', {
        header: 'Detectado',
        cell: (info) => {
          const date = info.getValue() as string;
          return date ? new Date(date).toLocaleDateString('es-CL') : '-';
        },
      }),
    ],
    []
  );

  return (
    <DataTable
      data={data as unknown as Record<string, unknown>[]}
      columns={columns}
      loading={loading}
      pageSize={10}
    />
  );
}

interface ProgressByStoreyTableProps {
  data: Array<{
    storey: string;
    totalElements: number;
    completedElements: number;
    progress: number;
    volume: number;
  }>;
  loading?: boolean;
}

export function ProgressByStoreyTable({ data, loading }: ProgressByStoreyTableProps) {
  const columns = React.useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(
    () => [
      columnHelper.accessor('storey', {
        header: 'Nivel',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('totalElements', {
        header: 'Total Elementos',
        cell: (info) => info.getValue()?.toLocaleString('es-CL') || '0',
      }),
      columnHelper.accessor('completedElements', {
        header: 'Completados',
        cell: (info) => info.getValue()?.toLocaleString('es-CL') || '0',
      }),
      columnHelper.accessor('progress', {
        header: 'Avance (%)',
        cell: (info) => {
          const val = info.getValue() as number;
          return val ? `${val.toFixed(1)}%` : '0%';
        },
      }),
      columnHelper.accessor('volume', {
        header: 'Volumen (m³)',
        cell: (info) => {
          const val = info.getValue() as number;
          return val ? val.toLocaleString('es-CL', { maximumFractionDigits: 2 }) : '0';
        },
      }),
    ],
    []
  );

  return (
    <DataTable
      data={data as unknown as Record<string, unknown>[]}
      columns={columns}
      loading={loading}
      pageSize={10}
    />
  );
}

interface QualityIssuesTableProps {
  data: Array<{
    issue: string;
    count: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
  }>;
  loading?: boolean;
}

export function QualityIssuesTable({ data, loading }: QualityIssuesTableProps) {
  const columns = React.useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(
    () => [
      columnHelper.accessor('issue', {
        header: 'Problema',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('count', {
        header: 'Cantidad',
        cell: (info) => info.getValue()?.toLocaleString('es-CL') || '0',
      }),
      columnHelper.accessor('impact', {
        header: 'Impacto',
        cell: (info) => {
          const impact = info.getValue() as string;
          return (
            <span
              className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                impact === 'critical'
                  ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
                  : impact === 'high'
                    ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                    : impact === 'medium'
                      ? 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-400'
                      : 'bg-muted text-muted-foreground'
              )}
            >
              {impact === 'critical'
                ? 'Crítico'
                : impact === 'high'
                  ? 'Alto'
                  : impact === 'medium'
                    ? 'Medio'
                    : 'Bajo'}
            </span>
          );
        },
      }),
    ],
    []
  );

  return (
    <DataTable
      data={data as unknown as Record<string, unknown>[]}
      columns={columns}
      loading={loading}
      pageSize={5}
    />
  );
}

interface ResourceOptimizationTableProps {
  data: Array<{
    zone: string;
    plannedHours: number;
    actualHours: number;
    efficiency: number;
  }>;
  loading?: boolean;
}

export function ResourceOptimizationTable({ data, loading }: ResourceOptimizationTableProps) {
  const columns = React.useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(
    () => [
      columnHelper.accessor('zone', {
        header: 'Zona',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('plannedHours', {
        header: 'Horas Planificadas',
        cell: (info) => info.getValue()?.toLocaleString('es-CL') || '0',
      }),
      columnHelper.accessor('actualHours', {
        header: 'Horas Reales',
        cell: (info) => info.getValue()?.toLocaleString('es-CL') || '0',
      }),
      columnHelper.accessor('efficiency', {
        header: 'Eficiencia',
        cell: (info) => {
          const val = info.getValue() as number;
          return (
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    val >= 90
                      ? 'bg-success-500'
                      : val >= 75
                        ? 'bg-primary-500'
                        : val >= 60
                          ? 'bg-warning-500'
                          : 'bg-danger-500'
                  )}
                  style={{ width: `${Math.min(val, 100)}%` }}
                />
              </div>
              <span className="text-xs">{val?.toFixed(1) || '0'}%</span>
            </div>
          );
        },
      }),
    ],
    []
  );

  return (
    <DataTable
      data={data as unknown as Record<string, unknown>[]}
      columns={columns}
      loading={loading}
      pageSize={8}
    />
  );
}