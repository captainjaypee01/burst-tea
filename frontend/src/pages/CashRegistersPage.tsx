import { type FormEvent, type ReactElement, useCallback, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { BookOpen, Landmark, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'

import { createCashRegister, deactivateCashRegister, updateCashRegister } from '@/api/cash-registers'
import { DataTableServer } from '@/components/DataTableServer'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useCashRegisters } from '@/hooks/useCashRegisters'
import type { CashRegister } from '@/types/models'

const REGISTER_READ_PERMISSION = 'register.read'
const REGISTER_MANAGE_PERMISSION = 'register.manage'
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

export function CashRegistersPage(): ReactElement {
  const { user } = useAuth()
  const canRead = hasPermission(REGISTER_READ_PERMISSION, user)
  const canManage = hasPermission(REGISTER_MANAGE_PERMISSION, user)
  const canReadCashLedgerHistory = hasPermission(REGISTER_READ_PERMISSION, user) && hasPermission(CASH_READ_PERMISSION, user)

  const { setPage, data, meta, loading, error, reload } = useCashRegisters()

  const [createName, setCreateName] = useState('')
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CashRegister | null>(null)
  const [editName, setEditName] = useState('')
  const [deactivateTarget, setDeactivateTarget] = useState<CashRegister | null>(null)

  const openEdit = (row: CashRegister): void => {
    setEditing(row)
    setEditName(row.name)
    setDialogOpen(true)
  }

  const closeDialog = (): void => {
    setDialogOpen(false)
    setEditing(null)
    setEditName('')
  }

  const onCreate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const name = createName.trim()
    if (!name) {
      return
    }
    setSaving(true)
    try {
      await createCashRegister(name)
      setCreateName('')
      await reload()
    } finally {
      setSaving(false)
    }
  }

  const onSaveEdit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!editing) {
      return
    }
    const name = editName.trim()
    if (!name) {
      return
    }
    setSaving(true)
    try {
      await updateCashRegister(editing.id, { name })
      closeDialog()
      await reload()
    } finally {
      setSaving(false)
    }
  }

  const performDeactivate = useCallback(async () => {
    if (!deactivateTarget) {
      return
    }
    setSaving(true)
    try {
      await deactivateCashRegister(deactivateTarget.id)
      setDeactivateTarget(null)
      await reload()
    } finally {
      setSaving(false)
    }
  }, [deactivateTarget, reload])

  const onActivate = async (row: CashRegister): Promise<void> => {
    setSaving(true)
    try {
      await updateCashRegister(row.id, { is_active: true })
      await reload()
    } finally {
      setSaving(false)
    }
  }

  const columns = useMemo<ColumnDef<CashRegister, unknown>[]>(
    () => [
      { header: 'Name', accessorKey: 'name' },
      {
        header: 'Status',
        accessorKey: 'is_active',
        cell: ({ row }) => (
          <span className={row.original.is_active ? 'font-medium text-emerald-700' : 'text-muted'}>
            {row.original.is_active ? 'Active' : 'Inactive'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex flex-wrap justify-end gap-2">
              {canReadCashLedgerHistory ? (
                <Button variant="outline" size="sm" className="border-card-border" asChild>
                  <Link to={`/cash-registers/${r.id}/ledger-history`}>
                    <BookOpen className="size-3.5" aria-hidden />
                    History
                  </Link>
                </Button>
              ) : null}
              {canManage ? (
                <>
                  <Button type="button" variant="outline" size="sm" className="border-card-border" onClick={() => openEdit(r)}>
                    <Pencil className="size-3.5" aria-hidden />
                    Edit
                  </Button>
                  {r.is_active ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-800 hover:bg-red-50"
                      disabled={saving}
                      onClick={() => setDeactivateTarget(r)}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button type="button" size="sm" disabled={saving} onClick={() => void onActivate(r)}>
                      Activate
                    </Button>
                  )}
                </>
              ) : null}
            </div>
          )
        },
      },
    ],
    [canManage, canReadCashLedgerHistory, saving],
  )

  if (!canRead) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Cash registers</h1>
        <p className="text-sm text-muted">You do not have permission to view cash registers.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
            <Landmark className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cash registers</h1>
            <p className="mt-1 text-sm text-muted">
              Name each physical drawer or terminal. Inactive registers stay here for history and can be re-activated.
            </p>
            <p className="mt-2 text-sm">
              <Link to="/shifts/session" className="font-medium text-accent underline-offset-4 hover:underline">
                Back to shift session
              </Link>
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {canManage ? (
        <section className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Add register</h2>
          <form className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => void onCreate(event)}>
            <div className="min-w-0 flex-1 space-y-1">
              <label className="text-xs font-medium text-muted" htmlFor="new-register-name">
                Display name
              </label>
              <Input
                id="new-register-name"
                placeholder="e.g. Drive-through, Barista station"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                disabled={saving}
              />
            </div>
            <Button type="submit" disabled={saving}>
              Create
            </Button>
          </form>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">All registers</h2>
        <DataTableServer<CashRegister>
          columns={columns}
          data={data}
          meta={meta}
          isLoading={loading}
          onPageChange={(next) => setPage(next)}
        />
      </section>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit register</DialogTitle>
            <DialogDescription>Update the display name shown in the shift session picker.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void onSaveEdit(event)}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted" htmlFor="edit-register-name">
                Name
              </label>
              <Input
                id="edit-register-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                disabled={saving}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="border-card-border" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeactivateTarget(null)
          }
        }}
        title={deactivateTarget ? `Deactivate “${deactivateTarget.name}”?` : 'Deactivate register?'}
        description="It will be hidden from shift register lists until re-activated."
        confirmLabel="Deactivate"
        cancelLabel="Keep active"
        confirmVariant="destructive"
        pending={saving && deactivateTarget !== null}
        onConfirm={performDeactivate}
      />
    </div>
  )
}

export default CashRegistersPage
