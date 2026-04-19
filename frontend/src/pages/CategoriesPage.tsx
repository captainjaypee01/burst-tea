import { type ReactElement, useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { FolderTree } from 'lucide-react'

import { createCategory, deleteCategory, updateCategory } from '@/api/categories'
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
import { PERMISSIONS } from '@/constants/permissions'
import { useCategories } from '@/hooks/useCategories'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api-client'
import { hasPermission } from '@/lib/hasPermission'
import { useAuthStore } from '@/stores/authStore'
import type { Category } from '@/types/models'

export function CategoriesPage(): ReactElement {
  const user = useAuthStore((s) => s.user)
  const canRead = hasPermission(PERMISSIONS.CATEGORY_READ, user)
  const canCreate = hasPermission(PERMISSIONS.CATEGORY_CREATE, user)
  const canUpdate = hasPermission(PERMISSIONS.CATEGORY_UPDATE, user)
  const canDelete = hasPermission(PERMISSIONS.CATEGORY_DELETE, user)

  const { setPage, data, meta, loading, error, reload } = useCategories()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const openCreate = (): void => {
    setEditing(null)
    setName('')
    setSlug('')
    setSortOrder('0')
    setIsActive(true)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (row: Category): void => {
    setEditing(row)
    setName(row.name)
    setSlug(row.slug ?? '')
    setSortOrder(String(row.sort_order))
    setIsActive(row.is_active)
    setFormError(null)
    setDialogOpen(true)
  }

  const handleSave = async (): Promise<void> => {
    setFormError(null)
    const sort = Number.parseInt(sortOrder, 10)
    if (Number.isNaN(sort) || sort < 0) {
      setFormError('Sort order must be a non-negative integer.')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateCategory(editing.id, {
          name: name.trim(),
          slug: slug.trim() === '' ? null : slug.trim(),
          sort_order: sort,
          is_active: isActive,
        })
      } else {
        await createCategory({
          name: name.trim(),
          slug: slug.trim() === '' ? null : slug.trim(),
          sort_order: sort,
          is_active: isActive,
        })
      }
      setDialogOpen(false)
      await reload()
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const performDelete = useCallback(async (): Promise<void> => {
    if (!deleteTarget) {
      return
    }
    setDeleteBusy(true)
    try {
      await deleteCategory(deleteTarget.id)
      setDeleteTarget(null)
      await reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setDeleteBusy(false)
    }
  }, [deleteTarget, reload])

  const columns = useMemo<ColumnDef<Category, unknown>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) => (
          <Link
            className="font-medium text-accent underline-offset-4 hover:underline"
            to={`/categories/${row.original.id}`}
          >
            {row.original.name}
          </Link>
        ),
      },
      { header: 'Sort', accessorKey: 'sort_order' },
      {
        header: 'Active',
        accessorKey: 'is_active',
        cell: ({ row }) => (
          <span className={row.original.is_active ? 'font-medium text-emerald-700' : 'text-muted'}>
            {row.original.is_active ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        header: '',
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            {canUpdate ? (
              <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row.original)}>
                Edit
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-red-200 text-red-800 hover:bg-red-50"
                onClick={() => setDeleteTarget(row.original)}
              >
                Remove
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canDelete, canUpdate],
  )

  if (!canRead) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        You do not have permission to view categories.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
            <FolderTree className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Categories</h1>
            <p className="mt-1 text-sm text-muted">Group products for menus and reporting.</p>
          </div>
        </div>
        {canCreate ? (
          <Button type="button" onClick={openCreate}>
            Add category
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <DataTableServer<Category>
        columns={columns}
        data={data}
        meta={meta}
        isLoading={loading}
        onPageChange={(next) => setPage(next)}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit category' : 'New category'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update this category.' : 'Create a category for your catalog.'}
            </DialogDescription>
          </DialogHeader>
          {formError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {formError}
            </div>
          ) : null}
          <div className="grid gap-3 py-1">
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="cat-name">
                Name
              </label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="cat-slug">
                Slug (optional)
              </label>
              <Input id="cat-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="cat-sort">
                Sort order
              </label>
              <Input
                id="cat-sort"
                inputMode="numeric"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded border-border"
              />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        title={deleteTarget ? `Remove category “${deleteTarget.name}”?` : 'Remove category?'}
        description="It will be archived (soft-deleted)."
        confirmLabel="Remove"
        cancelLabel="Keep"
        confirmVariant="destructive"
        pending={deleteBusy}
        onConfirm={performDelete}
      />
    </div>
  )
}

export default CategoriesPage
