import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, Landmark, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PERMISSIONS } from '@/constants/permissions'
import { useCashRegisterOptions } from '@/hooks/useCashRegisterOptions'
import { useOrder } from '@/hooks/useOrder'
import { useShiftSession } from '@/hooks/useShiftSession'
import { cancelOrder } from '@/api/orders'
import { postPayment } from '@/api/payments'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoneyCents } from '@/lib/currency'
import { dollarsToCents } from '@/lib/money'
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
  /** Major units (e.g. PHP) — what the customer hands over; change is derived vs `remainingCents`. */
  const [cashTenderedInput, setCashTenderedInput] = useState('')
  const [confirmKind, setConfirmKind] = useState<null | 'cash' | 'maya' | 'gcash'>(null)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  const remainingCents = useMemo(() => {
    if (!order) {
      return 0
    }
    return Math.max(0, order.total_cents - order.amount_paid_cents)
  }, [order])

  const tenderedCents = useMemo(() => dollarsToCents(cashTenderedInput), [cashTenderedInput])
  const changeCents =
    tenderedCents !== null && remainingCents > 0 ? Math.max(0, tenderedCents - remainingCents) : null
  const cashTenderedValid = tenderedCents !== null && tenderedCents >= remainingCents && remainingCents > 0

  const submitPayment = useCallback(
    async (kind: 'cash' | 'maya' | 'gcash') => {
      if (!order || !canPay || remainingCents <= 0) {
        return
      }
      if (kind === 'cash' && !cashTenderedValid) {
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
        setConfirmKind(null)
        toast.success('Payment complete')
        await reload()
        navigate(`/orders/${order.id}`, { replace: true })
      } catch (err) {
        toast.error(getApiErrorMessage(err))
      } finally {
        setPayBusy(false)
      }
    },
    [order, canPay, remainingCents, cashTenderedValid, shift?.id, navigate, reload],
  )

  const performCancelOrder = useCallback(async () => {
    if (!order || !canCancelOrder || order.amount_paid_cents > 0 || order.status !== 'open') {
      return
    }
    setCancelBusy(true)
    try {
      await cancelOrder(order.id)
      setCancelConfirmOpen(false)
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
                onClick={() => setCancelConfirmOpen(true)}
              >
                Cancel order
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
              <div className="space-y-3 rounded-lg border border-card-border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Banknote className="size-4 shrink-0" />
                  Cash
                </div>
                <div className="space-y-2">
                  <label htmlFor="cash-tendered" className="text-xs text-muted">
                    Cash received (customer pays)
                  </label>
                  <Input
                    id="cash-tendered"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    value={cashTenderedInput}
                    onChange={(e) => setCashTenderedInput(e.target.value)}
                    disabled={payBusy || (canReadRegisters && !shift)}
                    className="tabular-nums"
                  />
                  {tenderedCents !== null && remainingCents > 0 ? (
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="text-muted">Change to give</span>
                      <span
                        className={`tabular-nums font-semibold ${cashTenderedValid ? 'text-foreground' : 'text-muted'}`}
                      >
                        {changeCents !== null ? formatMoneyCents(changeCents) : '—'}
                      </span>
                    </div>
                  ) : null}
                  {tenderedCents !== null && tenderedCents < remainingCents ? (
                    <p className="text-xs text-amber-800 dark:text-amber-200">Amount is less than the balance due.</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  className="w-full gap-2"
                  disabled={payBusy || (canReadRegisters && !shift) || !cashTenderedValid}
                  onClick={() => setConfirmKind('cash')}
                >
                  <Banknote className="size-4" />
                  Record cash payment
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={payBusy || (canReadRegisters && !shift)}
                  onClick={() => setConfirmKind('maya')}
                >
                  <Smartphone className="size-4" />
                  Maya
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={payBusy || (canReadRegisters && !shift)}
                  onClick={() => setConfirmKind('gcash')}
                >
                  <Landmark className="size-4" />
                  GCash
                </Button>
              </div>
              <p className="text-xs text-muted">
                Manual recording only — no PSP. For cash, enter what the customer gave; change is for the register. The
                recorded payment is the amount due only. Cash and e-wallet sales post to the shift cash ledger when the
                order is fully paid.
              </p>
            </div>
          ) : null}

          {!canPay ? (
            <p className="text-sm text-muted">You do not have permission to record payments.</p>
          ) : null}

          <Dialog
            open={confirmKind !== null}
            onOpenChange={(open) => {
              if (!open) {
                setConfirmKind(null)
              }
            }}
          >
            <DialogContent
              className="max-w-md"
              onPointerDownOutside={(e) => {
                if (payBusy) {
                  e.preventDefault()
                }
              }}
              onEscapeKeyDown={(e) => {
                if (payBusy) {
                  e.preventDefault()
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Confirm payment</DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-4 pt-2 text-start text-foreground">
                    {order ? (
                      <>
                        <p className="text-sm text-muted">
                          Order <span className="font-medium text-foreground">{order.order_number}</span>
                        </p>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted">Order total</dt>
                            <dd className="tabular-nums font-medium">{formatMoneyCents(order.total_cents)}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted">Already paid</dt>
                            <dd className="tabular-nums">{formatMoneyCents(order.amount_paid_cents)}</dd>
                          </div>
                          <div className="flex justify-between gap-4 border-t border-border pt-2">
                            <dt className="font-medium text-foreground">Amount due (this payment)</dt>
                            <dd className="tabular-nums font-semibold text-foreground">
                              {formatMoneyCents(remainingCents)}
                            </dd>
                          </div>
                        </dl>
                        {confirmKind === 'cash' && tenderedCents !== null ? (
                          <div className="rounded-lg border border-card-border bg-muted/40 p-3 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted">Cash received</span>
                              <span className="tabular-nums font-medium">{formatMoneyCents(tenderedCents)}</span>
                            </div>
                            {changeCents !== null ? (
                              <div className="mt-2 flex justify-between gap-4">
                                <span className="text-muted">Change to give</span>
                                <span className="tabular-nums font-medium">{formatMoneyCents(changeCents)}</span>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        {confirmKind === 'maya' || confirmKind === 'gcash' ? (
                          <p className="text-sm text-muted">
                            You are recording a manual <strong className="text-foreground">e-wallet</strong> transfer
                            ({confirmKind === 'maya' ? 'Maya' : 'GCash'}) for{' '}
                            <span className="tabular-nums font-medium text-foreground">
                              {formatMoneyCents(remainingCents)}
                            </span>
                            . No online payment will be processed.
                          </p>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  disabled={payBusy}
                  onClick={() => setConfirmKind(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={
                    payBusy ||
                    confirmKind === null ||
                    (confirmKind === 'cash' && !cashTenderedValid)
                  }
                  onClick={() => {
                    if (confirmKind !== null) {
                      void submitPayment(confirmKind)
                    }
                  }}
                >
                  {payBusy ? 'Recording…' : 'Confirm payment'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ConfirmDialog
            open={cancelConfirmOpen}
            onOpenChange={setCancelConfirmOpen}
            title="Cancel this order?"
            description="You can start a new order from the POS menu."
            confirmLabel="Cancel order"
            cancelLabel="Keep order"
            confirmVariant="destructive"
            pending={cancelBusy}
            onConfirm={performCancelOrder}
          />
        </>
      ) : null}
    </div>
  )
}

export default OrderCheckoutPage
