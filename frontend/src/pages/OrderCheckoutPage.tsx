import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, Landmark, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PERMISSIONS } from '@/constants/permissions'
import { useCashRegisterOptions } from '@/hooks/useCashRegisterOptions'
import { useOrder } from '@/hooks/useOrder'
import { useShiftSession } from '@/hooks/useShiftSession'
import { cancelOrder } from '@/api/orders'
import { postPayment } from '@/api/payments'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoneyCents } from '@/lib/currency'
import { hasPermission } from '@/lib/hasPermission'
import { useAuthStore } from '@/stores/authStore'

export function OrderCheckoutPage(): ReactElement {
  const params = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const orderId = params.orderId != null && /^\d+$/.test(params.orderId) ? Number(params.orderId) : NaN
  const validId = Number.isFinite(orderId)

  const canPay = hasPermission(PERMISSIONS.PAYMENT_CREATE, user)
  const canReadOrder = hasPermission(PERMISSIONS.ORDER_READ, user)
  const canCancelOrder = hasPermission(PERMISSIONS.ORDER_DELETE, user)
  const canReadRegisters = hasPermission('register.read', user)

  const { order, loading, error, reload } = useOrder(validId ? orderId : undefined, {
    enabled: validId && canReadOrder,
  })

  const { options: registerOptions, loading: registersLoading } = useCashRegisterOptions(canReadRegisters)
  const [selectedRegisterId, setSelectedRegisterId] = useState<number | null>(null)

  useEffect(() => {
    if (registerOptions.length > 0 && selectedRegisterId === null) {
      setSelectedRegisterId(registerOptions[0].id)
    }
  }, [registerOptions, selectedRegisterId])

  const { shift, loading: shiftLoading, error: shiftError } = useShiftSession(selectedRegisterId)

  const [payBusy, setPayBusy] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)

  const remainingCents = useMemo(() => {
    if (!order) {
      return 0
    }
    return Math.max(0, order.total_cents - order.amount_paid_cents)
  }, [order])

  const pay = useCallback(
    async (kind: 'cash' | 'maya' | 'gcash') => {
      if (!order || !canPay || remainingCents <= 0) {
        return
      }
      setPayBusy(true)
      try {
        if (kind === 'cash') {
          await postPayment({
            order_id: order.id,
            method: 'cash',
            amount_cents: remainingCents,
            shift_id: shift?.id,
          })
        } else {
          await postPayment({
            order_id: order.id,
            method: 'e_wallet',
            amount_cents: remainingCents,
            shift_id: shift?.id,
            e_wallet_provider: kind === 'maya' ? 'maya' : 'gcash',
          })
        }
        toast.success('Payment complete')
        await reload()
        navigate(`/orders/${order.id}`, { replace: true })
      } catch (err) {
        toast.error(getApiErrorMessage(err))
      } finally {
        setPayBusy(false)
      }
    },
    [order, canPay, remainingCents, shift?.id, navigate, reload],
  )

  const onCancelOrder = useCallback(async () => {
    if (!order || !canCancelOrder || order.amount_paid_cents > 0 || order.status !== 'open') {
      return
    }
    if (!window.confirm('Cancel this order? You can start a new order from the POS menu.')) {
      return
    }
    setCancelBusy(true)
    try {
      await cancelOrder(order.id)
      toast.success('Order cancelled')
      navigate('/pos/new', { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setCancelBusy(false)
    }
  }, [order, canCancelOrder, navigate])

  if (!canReadOrder) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        You need order read access to view checkout.
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
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="gap-1 px-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Link
            className="text-sm text-accent underline-offset-4 hover:underline"
            to={`/pos/${orderId}/compose`}
          >
            To composer
          </Link>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Checkout</h1>
        <p className="mt-1 text-sm text-muted">
          Review the order, choose register shift when needed, then record payment.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      {loading ? <p className="text-sm text-muted">Loading order…</p> : null}

      {!loading && order ? (
        <>
          <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
            <p className="text-sm font-medium text-muted">{order.order_number}</p>
            <ul className="mt-3 space-y-3">
              {(order.items ?? []).map((line) => {
                const label = line.variant?.product?.name
                  ? `${line.variant.product.name} · ${line.variant.name}`
                  : (line.variant?.name ?? `Item #${line.id}`)
                return (
                  <li key={line.id} className="flex flex-col gap-1 border-b border-card-border pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        {line.quantity}× {label}
                      </span>
                      <span className="tabular-nums text-muted">{formatMoneyCents(line.line_total_cents)}</span>
                    </div>
                    {line.notes ? <p className="text-xs text-muted">Note: {line.notes}</p> : null}
                  </li>
                )
              })}
            </ul>
            <Separator className="my-4" />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatMoneyCents(order.total_cents)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-muted">
              <span>Paid</span>
              <span className="tabular-nums">{formatMoneyCents(order.amount_paid_cents)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm font-medium">
              <span>Due</span>
              <span className="tabular-nums text-foreground">{formatMoneyCents(remainingCents)}</span>
            </div>
          </div>

          {order.status !== 'open' || remainingCents <= 0 ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              This order does not need payment.{' '}
              <Link className="font-medium text-accent underline-offset-4 hover:underline" to={`/orders/${order.id}`}>
                View order
              </Link>
            </div>
          ) : null}

          {canCancelOrder && order.status === 'open' && order.amount_paid_cents === 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={cancelBusy || payBusy}
                onClick={() => void onCancelOrder()}
              >
                {cancelBusy ? 'Cancelling…' : 'Cancel order'}
              </Button>
              <p className="text-xs text-muted">Abandon before paying — order is removed from checkout.</p>
            </div>
          ) : null}

          {canPay && order.status === 'open' && remainingCents > 0 ? (
            <div className="space-y-4 rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Pay</h2>
              {canReadRegisters ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted">Cash register (for shift)</p>
                  <Select
                    value={selectedRegisterId !== null ? String(selectedRegisterId) : ''}
                    onValueChange={(v) => {
                      setSelectedRegisterId(Number(v))
                    }}
                    disabled={registersLoading || registerOptions.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={registersLoading ? 'Loading…' : 'Select register'} />
                    </SelectTrigger>
                    <SelectContent>
                      {registerOptions.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {shiftError ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {shiftError}
                </div>
              ) : null}
              {shiftLoading ? <p className="text-xs text-muted">Loading shift…</p> : null}
              {!shiftLoading && shift === null && canReadRegisters ? (
                <p className="text-xs text-muted">No open shift for this register — open a shift on shift session.</p>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={payBusy || (canReadRegisters && !shift)}
                  onClick={() => void pay('cash')}
                >
                  <Banknote className="size-4" />
                  Cash
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={payBusy || (canReadRegisters && !shift)}
                  onClick={() => void pay('maya')}
                >
                  <Smartphone className="size-4" />
                  Maya
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={payBusy || (canReadRegisters && !shift)}
                  onClick={() => void pay('gcash')}
                >
                  <Landmark className="size-4" />
                  GCash
                </Button>
              </div>
              <p className="text-xs text-muted">
                Manual recording only — no PSP. Cash and e-wallet sales post to the shift cash ledger when the order is
                fully paid.
              </p>
            </div>
          ) : null}

          {!canPay ? (
            <p className="text-sm text-muted">You do not have permission to record payments.</p>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export default OrderCheckoutPage
