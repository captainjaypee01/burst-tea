import { type ReactElement, useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Boxes } from 'lucide-react'

import { DataTableServer } from '@/components/DataTableServer'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/types/models'

export function ProductsPage(): ReactElement {
  const { setPage, data, meta, loading, error } = useProducts()

  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      { header: 'Name', accessorKey: 'name' },
      {
        header: 'Variants',
        accessorFn: (row) => row.variants?.length ?? 0,
        id: 'variants_count',
        cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span>,
      },
      {
        header: 'Active',
        accessorKey: 'is_active',
        cell: ({ row }) => (
          <span
            className={
              row.original.is_active ? 'font-medium text-emerald-700' : 'text-muted'
            }
          >
            {row.original.is_active ? 'Yes' : 'No'}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
            <Boxes className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Products</h1>
            <p className="mt-1 text-sm text-muted">Catalog and variants for building orders at the register.</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <DataTableServer<Product>
        columns={columns}
        data={data}
        meta={meta}
        isLoading={loading}
        onPageChange={(next) => setPage(next)}
      />
    </div>
  )
}
