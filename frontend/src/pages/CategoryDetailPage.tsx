import { type ReactElement, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, FolderTree, Package } from 'lucide-react'

import { ProductCreateDialog } from '@/components/catalog/ProductCreateDialog'
import { DataTableServer } from '@/components/DataTableServer'
import { Button } from '@/components/ui/button'
import { PERMISSIONS } from '@/constants/permissions'
import { useCategory } from '@/hooks/useCategory'
import { useProducts } from '@/hooks/useProducts'
import { formatMoneyCents } from '@/lib/currency'
import { hasPermission } from '@/lib/hasPermission'
import { useAuthStore } from '@/stores/authStore'
import type { Product } from '@/types/models'

export function CategoryDetailPage(): ReactElement {
  const params = useParams()
  const user = useAuthStore((s) => s.user)
  const categoryIdParam = params.categoryId
  const categoryId = categoryIdParam != null && /^\d+$/.test(categoryIdParam) ? Number(categoryIdParam) : NaN

  const canReadCategory = hasPermission(PERMISSIONS.CATEGORY_READ, user)
  const canReadProduct = hasPermission(PERMISSIONS.PRODUCT_READ, user)
  const canCreateProduct = hasPermission(PERMISSIONS.PRODUCT_CREATE, user)
  const canAccessCatalog = canReadCategory && canReadProduct
  const categoryIdValid = Number.isFinite(categoryId)
  const fetchEnabled = canAccessCatalog && categoryIdValid

  const { category, loading: loadingCategory, error: categoryError, reload: reloadCategory } = useCategory(
    categoryIdValid ? categoryId : undefined,
    { enabled: fetchEnabled },
  )

  const { setPage, data, meta, loading, error: productsError, reload: reloadProducts } = useProducts(15, {
    categoryId: categoryIdValid ? categoryId : undefined,
    enabled: fetchEnabled,
  })

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
            state={
              category
                ? { fromCategory: { id: category.id, name: category.name } }
                : undefined
            }
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        header: 'Variants',
        accessorFn: (row) => row.variants?.length ?? 0,
        id: 'variants_count',
        cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span>,
      },
      {
        header: 'From',
        id: 'from_price',
        accessorFn: (row) => {
          const prices = row.variants?.map((v) => v.price_cents) ?? []
          if (prices.length === 0) {
            return null
          }
          return Math.min(...prices)
        },
        cell: ({ getValue }) => {
          const cents = getValue() as number | null
          return cents == null ? <span className="text-muted">—</span> : <span className="tabular-nums">{formatMoneyCents(cents)}</span>
        },
      },
      {
        header: 'Active',
        accessorKey: 'is_active',
        cell: ({ row }) => (
          <span className={row.original.is_active ? 'font-medium text-emerald-700' : 'text-muted'}>
            {row.original.is_active ? 'Yes' : 'No'}
          </span>
        ),
      },
    ],
    [category],
  )

  if (!canReadCategory || !canReadProduct) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        You need category and product access to view this page.
      </div>
    )
  }

  if (!Number.isFinite(categoryId)) {
    return (
      <div className="space-y-2 text-sm text-muted">
        Invalid category.{' '}
        <Link className="text-accent underline" to="/categories">
          Back to categories
        </Link>
      </div>
    )
  }

  if (loadingCategory && !category) {
    return <div className="text-sm text-muted">Loading…</div>
  }

  if (categoryError || !category) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{categoryError ?? 'Category not found.'}</div>
        <Link className="text-sm text-accent underline" to="/categories">
          Back to categories
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <Button type="button" variant="outline" size="sm" className="w-fit border-card-border" asChild>
          <Link to="/categories" className="inline-flex items-center gap-2">
            <ArrowLeft className="size-4" aria-hidden />
            Categories
          </Link>
        </Button>
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
            <FolderTree className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{category.name}</h1>
            <p className="mt-1 text-sm text-muted">Products in this category. Create new items without picking another catalog group.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          <span>
            Sort order: <span className="tabular-nums text-foreground">{category.sort_order}</span>
          </span>
          <span>{category.is_active ? <span className="text-emerald-700">Active</span> : <span>Inactive</span>}</span>
        </div>
        {canCreateProduct ? (
          <Button type="button" onClick={() => setCreateOpen(true)} className="shrink-0">
            <Package className="size-4" aria-hidden />
            New product
          </Button>
        ) : null}
      </div>

      {productsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {productsError}
        </div>
      ) : null}

      <DataTableServer<Product>
        columns={columns}
        data={data}
        meta={meta}
        isLoading={loading}
        onPageChange={(next) => setPage(next)}
      />

      <ProductCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        lockedCategory={{ id: category.id, name: category.name }}
        onCreated={() => {
          void reloadProducts()
          void reloadCategory()
        }}
      />
    </div>
  )
}

export default CategoryDetailPage
