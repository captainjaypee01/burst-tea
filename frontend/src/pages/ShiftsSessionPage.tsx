import { type FormEvent, type ReactElement, useEffect, useMemo, useState } from 'react'
import { Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

import { createCashAdvance } from '@/api/cash-advances'
import { createExpense } from '@/api/expenses'
import { CashLedgerPanel } from '@/components/shifts/CashLedgerPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useCashRegisterOptions } from '@/hooks/useCashRegisterOptions'
import { useShiftSession } from '@/hooks/useShiftSession'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoneyCents } from '@/lib/money'

const SHIFT_OPEN_PERMISSION = 'shift.open'
const SHIFT_CLOSE_PERMISSION = 'shift.close'
const CASH_READ_PERMISSION = 'cash.read'
const CASH_ADJUST_PERMISSION = 'cash.adjust'
const REGISTER_READ_PERMISSION = 'register.read'
const REGISTER_MANAGE_PERMISSION = 'register.manage'
const EXPENSE_CREATE_PERMISSION = 'expense.create'
const ADVANCE_CREATE_PERMISSION = 'advance.create'

type CashMovementKind = 'expense' | 'advance' | 'adjustment'

function hasPermission(
  permission: string,
  user: { is_superadmin: boolean; permissions?: string[] } | null,
): boolean {
  if (!user) {
    return false
  }

  if (user.is_superadmin) {
    return true
  }

  return user.permissions?.includes(permission) ?? false
}

export function ShiftsSessionPage(): ReactElement {
  const { user } = useAuth()
  const canReadRegisters = hasPermission(REGISTER_READ_PERMISSION, user)
  const canManageRegisters = hasPermission(REGISTER_MANAGE_PERMISSION, user)
  const { options: registerOptions, loading: registersLoading, error: registersError } = useCashRegisterOptions(
    canReadRegisters,
  )

  const [selectedRegisterId, setSelectedRegisterId] = useState<number | null>(null)

  useEffect(() => {
    if (registerOptions.length > 0 && selectedRegisterId === null) {
      setSelectedRegisterId(registerOptions[0].id)
    }
  }, [registerOptions, selectedRegisterId])

  const { shift, loading: shiftLoading, error: shiftError, open, close, recordAdjustment } =
    useShiftSession(selectedRegisterId)

  const [openingCashInput, setOpeningCashInput] = useState('')
  const [closingCashInput, setClosingCashInput] = useState('')
  const [adjustDeltaInput, setAdjustDeltaInput] = useState('')
  const [adjustReasonInput, setAdjustReasonInput] = useState('')

  const [ledgerReloadNonce, setLedgerReloadNonce] = useState(0)

  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('')
  const [expenseBusy, setExpenseBusy] = useState(false)

  const [advanceAmount, setAdvanceAmount] = useState('')
  const [advanceDescription, setAdvanceDescription] = useState('')
  const [advanceBusy, setAdvanceBusy] = useState(false)

  const [cashMovementError, setCashMovementError] = useState<string | null>(null)

  const canOpen = hasPermission(SHIFT_OPEN_PERMISSION, user)
  const canClose = hasPermission(SHIFT_CLOSE_PERMISSION, user)
  const canReadCash = hasPermission(CASH_READ_PERMISSION, user)
  const canAdjust = hasPermission(CASH_ADJUST_PERMISSION, user)
  const canCreateExpense = hasPermission(EXPENSE_CREATE_PERMISSION, user)
  const canCreateAdvance = hasPermission(ADVANCE_CREATE_PERMISSION, user)

  const allowedCashMovementKinds = useMemo((): CashMovementKind[] => {
    const kinds: CashMovementKind[] = []
    if (canCreateExpense) {
      kinds.push('expense')
    }
    if (canCreateAdvance) {
      kinds.push('advance')
    }
    if (canAdjust) {
      kinds.push('adjustment')
    }
    return kinds
  }, [canAdjust, canCreateAdvance, canCreateExpense])

  const [cashMovementKind, setCashMovementKind] = useState<CashMovementKind>('expense')

  // Sync when permissions change; depend on primitives so array identity does not retrigger spuriously.
  useEffect(() => {
    const kinds: CashMovementKind[] = []
    if (canCreateExpense) {
      kinds.push('expense')
    }
    if (canCreateAdvance) {
      kinds.push('advance')
    }
    if (canAdjust) {
      kinds.push('adjustment')
    }
    if (kinds.length === 0) {
      return
    }
    setCashMovementKind((prev) => (kinds.includes(prev) ? prev : kinds[0]))
  }, [canAdjust, canCreateAdvance, canCreateExpense])

  const onOpen = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const openingCashCents = Math.round(Number(openingCashInput) * 100)
    if (!Number.isFinite(openingCashCents) || openingCashCents < 0) {
      return
    }

    await open(openingCashCents)
    setOpeningCashInput('')
  }

  const onClose = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const closingCashCents = Math.round(Number(closingCashInput) * 100)
    if (!Number.isFinite(closingCashCents) || closingCashCents < 0) {
      return
    }

    await close(closingCashCents)
    setClosingCashInput('')
  }

  const onAdjust = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const deltaCents = Math.round(Number(adjustDeltaInput) * 100)
    const reason = adjustReasonInput.trim()
    if (!Number.isFinite(deltaCents) || deltaCents === 0) {
      return
    }
    if (reason === '') {
      return
    }

    await recordAdjustment(deltaCents, reason)
    setAdjustDeltaInput('')
    setAdjustReasonInput('')
    setLedgerReloadNonce((n) => n + 1)
  }

  const onExpense = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!shift) {
      return
    }
    setCashMovementError(null)
    const amountCents = Math.round(Number(expenseAmount) * 100)
    const description = expenseDescription.trim()
    if (description === '' || !Number.isFinite(amountCents) || amountCents < 1) {
      return
    }
    setExpenseBusy(true)
    try {
      await createExpense({
        shift_id: shift.id,
        description,
        amount_cents: amountCents,
        category: expenseCategory.trim() === '' ? null : expenseCategory.trim(),
      })
      setExpenseDescription('')
      setExpenseAmount('')
      setExpenseCategory('')
      setLedgerReloadNonce((n) => n + 1)
    } catch (err) {
      setCashMovementError(getApiErrorMessage(err))
    } finally {
      setExpenseBusy(false)
    }
  }

  const onAdvance = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!shift || !user) {
      return
    }
    setCashMovementError(null)
    const amountCents = Math.round(Number(advanceAmount) * 100)
    if (!Number.isFinite(amountCents) || amountCents < 1) {
      return
    }
    setAdvanceBusy(true)
    try {
      await createCashAdvance({
        user_id: user.id,
        shift_id: shift.id,
        amount_cents: amountCents,
        description: advanceDescription.trim() === '' ? null : advanceDescription.trim(),
      })
      setAdvanceAmount('')
      setAdvanceDescription('')
      setLedgerReloadNonce((n) => n + 1)
    } catch (err) {
      setCashMovementError(getApiErrorMessage(err))
    } finally {
      setAdvanceBusy(false)
    }
  }

  const selectedRegisterLabel =
    registerOptions.find((r) => r.id === selectedRegisterId)?.name ?? 'Select register'

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
          <Wallet className="size-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Shift Session</h1>
          <p className="mt-1 text-sm text-muted">
            Choose a cash register, then open or close its shift and review the ledger. Close your current shift before
            opening another register.
          </p>
        </div>
      </div>

      {!canReadRegisters ? (
        <p className="text-sm text-muted">You need register list permission to use shift sessions.</p>
      ) : (
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground" id="cash-register-label">
            Cash register
          </span>
          {registerOptions.length === 0 ? (
            <p className="text-sm text-muted">
              {canManageRegisters ? (
                <>
                  No active cash registers.{' '}
                  <Link to="/cash-registers" className="font-medium text-accent underline-offset-4 hover:underline">
                    Open the cash registers page
                  </Link>{' '}
                  to create one.
                </>
              ) : (
                <>No active cash registers. Ask an admin to add registers.</>
              )}
            </p>
          ) : (
            <Select
              value={selectedRegisterId != null ? String(selectedRegisterId) : undefined}
              onValueChange={(value: string) => {
                setSelectedRegisterId(Number(value))
              }}
              disabled={registersLoading}
            >
              <SelectTrigger id="cash-register-select" className="max-w-md" aria-labelledby="cash-register-label">
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
          )}
          {canManageRegisters && registerOptions.length > 0 ? (
            <p className="text-sm text-muted">
              <Link to="/cash-registers" className="font-medium text-accent underline-offset-4 hover:underline">
                Manage cash registers
              </Link>
            </p>
          ) : null}
          {registersError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{registersError}</div>
          ) : null}
        </div>
      )}

      {shiftError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{shiftError}</div>
      ) : null}

      {canReadRegisters && selectedRegisterId !== null ? (
        <>
          {!shift ? (
            <section className="space-y-3 rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">No active shift on {selectedRegisterLabel}</h2>
              <p className="text-sm text-muted">Open a shift by recording the opening float for this register.</p>
              <form className="flex flex-col gap-3 sm:max-w-xs" onSubmit={(event) => void onOpen(event)}>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Opening cash amount"
                  value={openingCashInput}
                  onChange={(event) => setOpeningCashInput(event.target.value)}
                  disabled={!canOpen || shiftLoading}
                />
                <Button type="submit" disabled={!canOpen || shiftLoading}>
                  Open Shift
                </Button>
              </form>
              {!canOpen ? <p className="text-sm text-muted">You do not have permission to open a shift.</p> : null}
            </section>
          ) : (
            <section className="space-y-4 rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Shift #{shift.id} · {shift.cash_register?.name ?? selectedRegisterLabel}
                </h2>
                <p className="text-sm text-muted">
                  Opened at {shift.opened_at ?? '-'} · Float {formatMoneyCents(shift.opening_cash_cents)}
                </p>
                <p className="text-sm text-muted">
                  Opened by{' '}
                  <span className="font-medium text-foreground">
                    {shift.user?.name ?? `User #${shift.user_id}`}
                  </span>
                </p>
              </div>

              {shift.status === 'open' ? (
                <>
                  <form className="flex flex-col gap-3 sm:max-w-xs" onSubmit={(event) => void onClose(event)}>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Closing cash amount"
                      value={closingCashInput}
                      onChange={(event) => setClosingCashInput(event.target.value)}
                      disabled={!canClose || shiftLoading}
                    />
                    <Button type="submit" disabled={!canClose || shiftLoading}>
                      Close Shift
                    </Button>
                  </form>
                  {!canClose ? <p className="text-sm text-muted">You do not have permission to close a shift.</p> : null}

                  {allowedCashMovementKinds.length > 0 ? (
                    <div className="space-y-4 border-t border-card-border pt-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Record ledger entry</h3>
                        <p className="mt-1 text-xs text-muted">
                          Choose the type of entry, then fill the form. Each save adds a row to the cash ledger below.
                        </p>
                      </div>
                      {cashMovementError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                          {cashMovementError}
                        </div>
                      ) : null}

                      <div className="space-y-2 sm:max-w-md">
                        <span className="text-xs font-medium text-muted" id="cash-movement-kind-label">
                          Entry type
                        </span>
                        <Select
                          value={cashMovementKind}
                          onValueChange={(value: string) => {
                            setCashMovementKind(value as CashMovementKind)
                            setCashMovementError(null)
                          }}
                          disabled={shiftLoading}
                        >
                          <SelectTrigger id="cash-movement-kind" aria-labelledby="cash-movement-kind-label">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {canCreateExpense ? (
                              <SelectItem value="expense">Expense</SelectItem>
                            ) : null}
                            {canCreateAdvance ? (
                              <SelectItem value="advance">Cash advance</SelectItem>
                            ) : null}
                            {canAdjust ? (
                              <SelectItem value="adjustment">Count adjustment</SelectItem>
                            ) : null}
                          </SelectContent>
                        </Select>
                      </div>

                      {cashMovementKind === 'expense' && canCreateExpense ? (
                        <form className="space-y-3 sm:max-w-md" onSubmit={(event) => void onExpense(event)}>
                          <p className="text-xs text-muted">
                            Petty cash or other money leaving the drawer for this shift. Enter the amount as a{' '}
                            <span className="font-medium text-foreground">positive</span> number — the ledger stores it as
                            cash <span className="font-medium text-foreground">out</span> (not a deposit into the drawer).
                          </p>
                          <Input
                            required
                            placeholder="Description (e.g. cleaning supplies)"
                            value={expenseDescription}
                            onChange={(event) => setExpenseDescription(event.target.value)}
                            disabled={expenseBusy || shiftLoading}
                          />
                          <Input
                            placeholder="Category (optional)"
                            value={expenseCategory}
                            onChange={(event) => setExpenseCategory(event.target.value)}
                            disabled={expenseBusy || shiftLoading}
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            required
                            placeholder="Amount"
                            value={expenseAmount}
                            onChange={(event) => setExpenseAmount(event.target.value)}
                            disabled={expenseBusy || shiftLoading}
                          />
                          <Button type="submit" variant="outline" className="border-card-border" disabled={expenseBusy || shiftLoading}>
                            {expenseBusy ? 'Saving…' : 'Record expense'}
                          </Button>
                        </form>
                      ) : null}

                      {cashMovementKind === 'advance' && canCreateAdvance ? (
                        <form className="space-y-3 sm:max-w-md" onSubmit={(event) => void onAdvance(event)}>
                          <p className="text-xs text-muted">
                            Advance for <span className="font-medium text-foreground">{user?.name ?? 'you'}</span>. Use a{' '}
                            <span className="font-medium text-foreground">positive</span> amount for cash taken from the
                            drawer — like expense, it is recorded as cash{' '}
                            <span className="font-medium text-foreground">out</span>, not money being put in.
                          </p>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            required
                            placeholder="Amount"
                            value={advanceAmount}
                            onChange={(event) => setAdvanceAmount(event.target.value)}
                            disabled={advanceBusy || shiftLoading}
                          />
                          <Input
                            placeholder="Note (optional)"
                            value={advanceDescription}
                            onChange={(event) => setAdvanceDescription(event.target.value)}
                            disabled={advanceBusy || shiftLoading}
                          />
                          <Button type="submit" variant="outline" className="border-card-border" disabled={advanceBusy || shiftLoading}>
                            {advanceBusy ? 'Saving…' : 'Record cash advance'}
                          </Button>
                        </form>
                      ) : null}

                      {cashMovementKind === 'adjustment' && canAdjust ? (
                        <form className="space-y-3 sm:max-w-md" onSubmit={(event) => void onAdjust(event)}>
                          <p className="text-xs text-muted">
                            Fixes the gap between <span className="font-medium text-foreground">expected</span> and{' '}
                            <span className="font-medium text-foreground">counted</span> cash. Use a{' '}
                            <span className="font-medium text-foreground">positive</span> value to add to expected cash, or
                            a <span className="font-medium text-foreground">negative</span> value (e.g. -2.50) when the
                            count is short. Your reason is stored for audit.
                          </p>
                          <Input
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="Adjustment (e.g. -2.50 or 5.00)"
                            value={adjustDeltaInput}
                            onChange={(event) => setAdjustDeltaInput(event.target.value)}
                            disabled={shiftLoading}
                          />
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted" htmlFor="adjust-reason">
                              Reason (required)
                            </label>
                            <Input
                              id="adjust-reason"
                              required
                              placeholder="Why you are adjusting the count (audit)"
                              value={adjustReasonInput}
                              onChange={(event) => setAdjustReasonInput(event.target.value)}
                              disabled={shiftLoading}
                            />
                          </div>
                          <Button type="submit" variant="outline" className="border-card-border" disabled={shiftLoading}>
                            Record adjustment
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  ) : (
                    <p className="border-t border-card-border pt-4 text-sm text-muted">
                      You do not have permission to record expenses, cash advances, or count adjustments.
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-2 text-sm text-muted">
                  <p>
                    Shift closed at {shift.closed_at ?? '-'} · Closing cash{' '}
                    {formatMoneyCents(shift.closing_cash_cents ?? 0)}
                  </p>
                  <p>
                    Closed by{' '}
                    <span className="font-medium text-foreground">
                      {shift.closed_by?.name ?? (shift.closed_by_user_id != null ? `User #${shift.closed_by_user_id}` : '—')}
                    </span>
                  </p>
                </div>
              )}
            </section>
          )}

          {canReadCash ? (
            <CashLedgerPanel
              shiftId={shift?.id ?? null}
              perPage={500}
              ledgerReloadNonce={ledgerReloadNonce}
              description="Complete history for this shift only, oldest entries first. Loads up to 500 rows per page—use Previous/Next if the shift has more."
            />
          ) : (
            <p className="text-sm text-muted">You do not have permission to view the cash ledger.</p>
          )}
        </>
      ) : null}
    </div>
  )
}

export default ShiftsSessionPage
