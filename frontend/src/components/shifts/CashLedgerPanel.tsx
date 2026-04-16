import { useEffect, useMemo, type ReactElement } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

import { DataTableServer } from '@/components/DataTableServer'
import { useShiftCashLedger } from '@/hooks/useShiftCashLedger'
import { formatMoneyCents } from '@/lib/money'
import type { CashLedgerEntry } from '@/types/models'

export type CashLedgerPanelProps = {
  shiftId: number | null
  perPage?: number
  title?: string
  description?: string
  /** Increment after posting to the ledger (e.g. expense) so the table refetches. */
  ledgerReloadNonce?: number
}

export function CashLedgerPanel({
  shiftId,
  perPage = 50,
  title = 'Cash ledger',
  description = 'Append-only rows for this shift, oldest first.',
  ledgerReloadNonce = 0,
}: CashLedgerPanelProps): ReactElement {
  const {
    data: ledgerData,
    meta: ledgerMeta,
    loading: ledgerLoading,
    error: ledgerError,
    page,
    setPage,
    reload,
  } = useShiftCashLedger(shiftId, perPage)

  useEffect(() => {
    if (ledgerReloadNonce === 0) {
      return
    }
    void reload()
  }, [ledgerReloadNonce, reload])

  const columns = useMemo<ColumnDef<CashLedgerEntry, unknown>[]>(
    () => [
      { header: 'Type', accessorKey: 'type' },
      {
        header: 'Amount',
        accessorKey: 'amount_cents',
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{formatMoneyCents(row.original.amount_cents)}</span>
        ),
      },
      { header: 'Notes', accessorKey: 'notes' },
      { header: 'At', accessorKey: 'created_at' },
    ],
    [],
  )

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
        {ledgerMeta ? (
          <p className="mt-1 text-xs text-muted">
            {ledgerMeta.total} row{ledgerMeta.total === 1 ? '' : 's'} total
            {ledgerMeta.last_page > 1 ? ` · page ${ledgerMeta.current_page} of ${ledgerMeta.last_page}` : ''}.
          </p>
        ) : null}
      </div>
      {ledgerError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{ledgerError}</div>
      ) : null}
      <DataTableServer<CashLedgerEntry>
        columns={columns}
        data={ledgerData}
        meta={ledgerMeta}
        isLoading={ledgerLoading}
        onPageChange={(nextPage) => {
          if (nextPage !== page) {
            setPage(nextPage)
          }
        }}
      />
    </section>
  )
}
