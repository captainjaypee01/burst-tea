import { type ReactElement, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Boxes, Package } from 'lucide-react'

import { ProductCreateDialog } from '@/components/catalog/ProductCreateDialog'
import { DataTableServer } from '@/components/DataTableServer'
import { Button } from '@/components/ui/button'
import { PERMISSIONS } from '@/constants/permissions'
import { useProducts } from '@/hooks/useProducts'
import { hasPermission } from '@/lib/hasPermission'
import { useAuthStore } from '@/stores/authStore'
import type { Product } from '@/types/models'

export function ProductsPage(): ReactElement {
  const user = useAuthStore((s) => s.user)
  const canCreate = hasPermission(PERMISSIONS.PRODUCT_CREATE, user)
  const canRead = hasPermission(PERMISSIONS.PRODUCT_READ, user)

  const { setPage, data, meta, loading, error, reload } = useProducts()
  const [createOpen, setCreateOpen] = useState(false)

  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) => (
          <Link
            className="font-medium text-accent underline-offset-4 hover:underline"
            to={`/products/${row.original.id}`}
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        header: 'Category',
        id: 'category',
        accessorFn: (row) => row.category?.name ?? '—',
        cell: ({ getValue }) => <span className="text-muted">{String(getValue())}</span>,
      },
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

  if (!canRead) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        You do not have permission to view products.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
            <Boxes className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Products</h1>
            <p className="mt-1 text-sm text-muted">Catalog and variants for building orders at the register.</p>
          </div>
        </div>
        {canCreate ? (
          <Button type="button" className="shrink-0" onClick={() => setCreateOpen(true)}>
            <Package className="size-4" aria-hidden />
            New product
          </Button>
        ) : null}
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

      <ProductCreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => void reload()} />
    </div>
  )
}

export default ProductsPage
