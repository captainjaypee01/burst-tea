import { type ReactElement, useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { fetchCashRegister } from '@/api/cash-registers'
import { CashLedgerPanel } from '@/components/shifts/CashLedgerPanel'
import { DataTableServer } from '@/components/DataTableServer'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useCashRegisterShifts } from '@/hooks/useCashRegisterShifts'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoneyCents } from '@/lib/money'
import type { CashRegister, Shift } from '@/types/models'

const REGISTER_READ_PERMISSION = 'register.read'
const CASH_READ_PERMISSION = 'cash.read'

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

export function CashRegisterLedgerHistoryPage(): ReactElement {
  const { cashRegisterId: cashRegisterIdParam } = useParams<{ cashRegisterId: string }>()
  const { user } = useAuth()

  const canAccess = hasPermission(REGISTER_READ_PERMISSION, user) && hasPermission(CASH_READ_PERMISSION, user)

  const registerId = cashRegisterIdParam != null && /^\d+$/.test(cashRegisterIdParam) ? Number(cashRegisterIdParam) : NaN

  const [register, setRegister] = useState<CashRegister | null>(null)
  const [registerLoadError, setRegisterLoadError] = useState<string | null>(null)
  const [registerLoading, setRegisterLoading] = useState(true)

  const [viewingLedgerShiftId, setViewingLedgerShiftId] = useState<number | null>(null)
  const [ledgerReloadNonce, setLedgerReloadNonce] = useState(0)

  const {
    setPage: setHistoryPage,
    data: historyShifts,
    meta: historyMeta,
    loading: historyLoading,
    error: historyError,
    reload: reloadHistoryShifts,
  } = useCashRegisterShifts(Number.isFinite(registerId) && canAccess ? registerId : null, 15)

  useEffect(() => {
    if (!canAccess || !Number.isFinite(registerId)) {
      setRegisterLoading(false)
      setRegister(null)
      setRegisterLoadError(null)
      return
    }

    let cancelled = false
    setRegisterLoading(true)
    setRegisterLoadError(null)
    void fetchCashRegister(registerId)
      .then((row) => {
        if (!cancelled) {
          setRegister(row)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRegister(null)
          setRegisterLoadError(getApiErrorMessage(err))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRegisterLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [canAccess, registerId])

  const historyColumns = useMemo<ColumnDef<Shift, unknown>[]>(
    () => [
      {
        header: 'Shift',
        accessorKey: 'id',
        cell: ({ row }) => <span className="font-mono tabular-nums">#{row.original.id}</span>,
      },
      {
        header: 'Opened',
        accessorKey: 'opened_at',
        cell: ({ row }) => <span className="text-sm">{row.original.opened_at ?? '—'}</span>,
      },
      {
        header: 'Closed',
        accessorKey: 'closed_at',
        cell: ({ row }) => <span className="text-sm">{row.original.closed_at ?? '—'}</span>,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => <span className="capitalize">{row.original.status}</span>,
      },
      {
        header: 'Float → close',
        id: 'amounts',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted">
            {formatMoneyCents(row.original.opening_cash_cents)}
            {row.original.closing_cash_cents != null ? ` → ${formatMoneyCents(row.original.closing_cash_cents)}` : ''}
          </span>
        ),
      },
      {
        id: 'ledger',
        header: '',
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-card-border"
            onClick={() => setViewingLedgerShiftId(row.original.id)}
          >
            View ledger
          </Button>
        ),
      },
    ],
    [],
  )

  if (!canAccess) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Cash ledger history</h1>
        <p className="text-sm text-muted">You need register and cash ledger access to view this page.</p>
        <p className="text-sm">
          <Link to="/cash-registers" className="font-medium text-accent underline-offset-4 hover:underline">
            Back to cash registers
          </Link>
        </p>
      </div>
    )
  }

  if (!Number.isFinite(registerId)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Cash ledger history</h1>
        <p className="text-sm text-muted">Invalid register id in the URL.</p>
        <p className="text-sm">
          <Link to="/cash-registers" className="font-medium text-accent underline-offset-4 hover:underline">
            Back to cash registers
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Button type="button" variant="outline" size="sm" className="w-fit border-card-border" asChild>
            <Link to="/cash-registers" className="inline-flex items-center gap-2">
              <ArrowLeft className="size-4" aria-hidden />
              Cash registers
            </Link>
          </Button>
          {!registerLoading && register && !registerLoadError ? (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {viewingLedgerShiftId !== null ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-card-border"
                    onClick={() => setViewingLedgerShiftId(null)}
                  >
                    ← Back to shifts
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted"
                    onClick={() => setLedgerReloadNonce((n) => n + 1)}
                  >
                    Refresh ledger
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted"
                  onClick={() => void reloadHistoryShifts()}
                >
                  Refresh shift list
                </Button>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
            <BookOpen className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cash ledger history</h1>
            {registerLoading ? (
              <p className="mt-1 text-sm text-muted">Loading register…</p>
            ) : register ? (
              <p className="mt-1 text-sm text-muted">
                Shifts for <strong className="font-medium text-foreground">{register.name}</strong>. Newest shifts first;
                open a ledger to review append-only rows for that shift.
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">Could not load this register.</p>
            )}
            <p className="mt-2 text-sm">
              <Link to="/shifts/session" className="font-medium text-accent underline-offset-4 hover:underline">
                Shift session
              </Link>
            </p>
          </div>
        </div>
      </div>

      {registerLoadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {registerLoadError}
        </div>
      ) : null}

      {!registerLoading && register && !registerLoadError ? (
        <>
          {historyError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {historyError}
            </div>
          ) : null}

          {viewingLedgerShiftId === null ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Shifts</h2>
              <DataTableServer<Shift>
                columns={historyColumns}
                data={historyShifts}
                meta={historyMeta}
                isLoading={historyLoading}
                onPageChange={(next) => {
                  setHistoryPage(next)
                }}
              />
            </section>
          ) : (
            <section className="space-y-4">
              <CashLedgerPanel
                shiftId={viewingLedgerShiftId}
                perPage={100}
                ledgerReloadNonce={ledgerReloadNonce}
                title={`Shift #${viewingLedgerShiftId} · cash ledger`}
                description="Same append-only ledger as on the shift session page. Oldest rows first within each page."
              />
            </section>
          )}
        </>
      ) : null}
    </div>
  )
}

export default CashRegisterLedgerHistoryPage
