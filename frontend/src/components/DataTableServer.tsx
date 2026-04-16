import type { ReactElement } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import type { PaginatedMeta } from '@/types/api'
import { cn } from '@/lib/utils'

type DataTableServerProps<T> = {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  meta: PaginatedMeta | null
  isLoading: boolean
  onPageChange: (page: number) => void
}

export function DataTableServer<T>({
  columns,
  data,
  meta,
  isLoading,
  onPageChange,
}: DataTableServerProps<T>): ReactElement {
  const lastPage = Math.max(meta?.last_page ?? 1, 1)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: lastPage,
  })

  const current = meta?.current_page ?? 1
  const last = lastPage

  return (
    <div className="w-full space-y-4">
      <div className="overflow-hidden rounded-xl border border-card-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-card-border bg-muted-bg">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted"
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[color-mix(in_oklab,var(--color-border)_70%,transparent)]">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-muted" colSpan={columns.length}>
                    Loading…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-muted" colSpan={columns.length}>
                    No rows.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-[color-mix(in_oklab,var(--color-muted-bg)_85%,white)]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle text-foreground">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
          'text-sm text-muted',
        )}
      >
        <div>
          Page {current} of {last}
          {meta ? ` · ${meta.total} total` : null}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={current <= 1 || isLoading}
            onClick={() => onPageChange(current - 1)}
            className="border-card-border"
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={current >= last || isLoading}
            onClick={() => onPageChange(current + 1)}
            className="border-card-border"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
