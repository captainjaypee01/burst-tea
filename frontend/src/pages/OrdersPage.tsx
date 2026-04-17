import { type ReactElement, useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { CreditCard, Eye, Receipt, ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { DataTableServer } from '@/components/DataTableServer'
import { Button } from '@/components/ui/button'
import { cancelOrder } from '@/api/orders'
import { PERMISSIONS } from '@/constants/permissions'
import { useOrders } from '@/hooks/useOrders'
import { formatLocalDateTime } from '@/lib/datetime'
import { getApiErrorMessage } from '@/lib/api-client'
import { hasPermission } from '@/lib/hasPermission'
import { useAuthStore } from '@/stores/authStore'
import type { Order } from '@/types/models'

function isOpenUnpaid(order: Order): boolean {
  return order.status === 'open' && order.amount_paid_cents < order.total_cents
}

export function OrdersPage(): ReactElement {
  const user = useAuthStore((s) => s.user)
  const canCancel = hasPermission(PERMISSIONS.ORDER_DELETE, user)

  const { setPage, data, meta, loading, error, reload } = useOrders()
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const onCancelOrder = useCallback(
    async (order: Order) => {
      if (!canCancel || order.status !== 'open' || order.amount_paid_cents > 0) {
        return
      }
      if (!window.confirm(`Cancel order ${order.order_number}? This cannot be undone.`)) {
        return
      }
      setCancellingId(order.id)
      try {
        await cancelOrder(order.id)
        toast.success('Order cancelled')
        await reload()
      } catch (err) {
        toast.error(getApiErrorMessage(err))
      } finally {
        setCancellingId(null)
      }
    },
    [canCancel, reload],
  )

  const columns = useMemo<ColumnDef<Order, unknown>[]>(
    () => [
      { header: 'Order #', accessorKey: 'order_number' },
      {
        header: 'Created',
        accessorKey: 'created_at',
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">
            {formatLocalDateTime(row.original.created_at)}
          </span>
        ),
      },
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
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const o = row.original
          const pending = isOpenUnpaid(o)
          const showCancel = canCancel && o.status === 'open' && o.amount_paid_cents === 0

          return (
            <div className="flex max-w-[22rem] flex-wrap items-center gap-2">
              {pending ? (
                <>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 border-border/20 bg-secondary/40 px-3 text-xs shadow-sm hover:bg-secondary/70" asChild>
                    <Link to={`/pos/${o.id}/compose`}>
                      <ShoppingCart className="size-3.5 shrink-0 opacity-90" aria-hidden />
                      Cart
                    </Link>
                  </Button>
                  <Button size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm" asChild>
                    <Link to={`/pos/${o.id}/checkout`}>
                      <CreditCard className="size-3.5 shrink-0 opacity-90" aria-hidden />
                      Checkout
                    </Link>
                  </Button>
                </>
              ) : null}
              {showCancel ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 border-destructive/30 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={cancellingId === o.id}
                  onClick={() => void onCancelOrder(o)}
                >
                  <Trash2 className="size-3.5 shrink-0" aria-hidden />
                  {cancellingId === o.id ? '…' : 'Cancel'}
                </Button>
              ) : null}
              <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs" asChild>
                <Link to={`/orders/${o.id}`}>
                  <Eye className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  View
                </Link>
              </Button>
            </div>
          )
        },
      },
    ],
    [canCancel, cancellingId, onCancelOrder],
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
        <Button type="button" asChild>
          <Link to="/pos/new">New order</Link>
        </Button>
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
