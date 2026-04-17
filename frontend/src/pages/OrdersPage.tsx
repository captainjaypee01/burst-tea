import { type ReactElement, useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Receipt } from 'lucide-react'

import { DataTableServer } from '@/components/DataTableServer'
import { useOrders } from '@/hooks/useOrders'
import type { Order } from '@/types/models'

export function OrdersPage(): ReactElement {
  const { setPage, data, meta, loading, error } = useOrders()

  const columns = useMemo<ColumnDef<Order, unknown>[]>(
    () => [
      { header: 'Order #', accessorKey: 'order_number' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Payment', accessorKey: 'payment_status' },
      {
        header: 'Total',
        accessorKey: 'total_cents',
        cell: ({ row }) => {
          const cents = row.original.total_cents
          return <span className="font-medium tabular-nums">{(cents / 100).toFixed(2)}</span>
        },
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
            <Receipt className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Orders</h1>
            <p className="mt-1 text-sm text-muted">Server-paginated list of POS orders (staff view).</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <DataTableServer<Order>
        columns={columns}
        data={data}
        meta={meta}
        isLoading={loading}
        onPageChange={(next) => setPage(next)}
      />
    </div>
  )
}

export default OrdersPage
