import type { ReactElement } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Landmark, Receipt } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PERMISSIONS } from '@/constants/permissions'
import { useOrder } from '@/hooks/useOrder'
import { formatMoneyCents } from '@/lib/currency'
import { hasPermission } from '@/lib/hasPermission'
import { useAuthStore } from '@/stores/authStore'

export function OrderDetailPage(): ReactElement {
  const params = useParams()
  const user = useAuthStore((s) => s.user)

  const orderId = params.orderId != null && /^\d+$/.test(params.orderId) ? Number(params.orderId) : NaN
  const validId = Number.isFinite(orderId)

  const canRead = hasPermission(PERMISSIONS.ORDER_READ, user)
  const canReadCash = hasPermission('cash.read', user)
  const canReadRegisters = hasPermission('register.read', user)

  const { order, loading, error } = useOrder(validId ? orderId : undefined, {
    enabled: validId && canRead,
  })

  if (!canRead) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        You need order read access to view this page.
      </div>
    )
  }

  if (!validId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Invalid order.
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
            <Receipt className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Order</h1>
            <p className="mt-1 text-sm text-muted">
              {order?.order_number ?? (loading ? 'Loading…' : '—')} · {order?.status ?? ''}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/orders">
            <ArrowLeft className="mr-2 size-4" />
            Orders
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      {loading ? <p className="text-sm text-muted">Loading…</p> : null}

      {!loading && order ? (
        <>
          <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <p className="text-muted">Payment</p>
                <p className="font-medium capitalize">{order.payment_status}</p>
              </div>
              <div>
                <p className="text-muted">Total</p>
                <p className="font-medium tabular-nums">{formatMoneyCents(order.total_cents)}</p>
              </div>
              <div>
                <p className="text-muted">Paid</p>
                <p className="font-medium tabular-nums">{formatMoneyCents(order.amount_paid_cents)}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              {(order.items ?? []).map((line) => {
                const label = line.variant?.product?.name
                  ? `${line.variant.product.name} · ${line.variant.name}`
                  : (line.variant?.name ?? `Item #${line.id}`)
                return (
                  <div key={line.id} className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">
                        {line.quantity}× {label}
                      </span>
                      <span className="tabular-nums text-muted">{formatMoneyCents(line.line_total_cents)}</span>
                    </div>
                    {line.notes ? <p className="text-xs text-muted">Note: {line.notes}</p> : null}
                  </div>
                )
              })}
            </div>
          </div>

          {(order.payments ?? []).length > 0 ? (
            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Payments</h2>
              <ul className="mt-3 space-y-3">
                {(order.payments ?? []).map((p) => (
                  <li key={p.id} className="flex flex-col gap-2 border-b border-card-border pb-3 text-sm last:border-0 last:pb-0">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-medium capitalize">{p.method.replaceAll('_', ' ')}</span>
                      <span className="tabular-nums">{formatMoneyCents(p.amount_cents)}</span>
                    </div>
                    {p.e_wallet_provider ? (
                      <p className="text-xs text-muted">E-wallet: {p.e_wallet_provider}</p>
                    ) : null}
                    {p.shift_id && canReadCash && canReadRegisters && p.shift?.cash_register_id ? (
                      <Link
                        className="inline-flex items-center gap-2 text-sm font-medium text-accent underline-offset-4 hover:underline"
                        to={`/cash-registers/${p.shift.cash_register_id}/ledger-history`}
                      >
                        <Landmark className="size-4" />
                        View cash ledger for this register
                      </Link>
                    ) : p.shift_id ? (
                      <Link
                        className="inline-flex items-center gap-2 text-sm font-medium text-accent underline-offset-4 hover:underline"
                        to="/shifts/session"
                      >
                        <Landmark className="size-4" />
                        Shift session
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {order.status === 'open' ? (
              <Button variant="outline" asChild>
                <Link to={`/pos/${order.id}/compose`}>Edit in composer</Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link to="/shifts/session">Shift session</Link>
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default OrderDetailPage
