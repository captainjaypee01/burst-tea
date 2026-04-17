import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'

import { createProduct } from '@/api/products'
import { fetchCategoryOptions } from '@/api/categories'
import type { CategoryOptionRow } from '@/api/categories'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CATEGORY_NONE_VALUE } from '@/constants/catalog'
import { getApiErrorMessage } from '@/lib/api-client'
import { dollarsToCents } from '@/lib/money'
import { cn } from '@/lib/utils'

type VariantDraft = {
  id: string
  name: string
  price: string
  sku: string
  is_active: boolean
}

function newVariantRow(): VariantDraft {
  return {
    id: crypto.randomUUID(),
    name: '',
    price: '',
    sku: '',
    is_active: true,
  }
}

export type LockedCategory = {
  id: number
  name: string
}

type ProductCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  /** When set, category cannot be changed (e.g. creating from a category detail page). */
  lockedCategory?: LockedCategory | null
}

export function ProductCreateDialog({
  open,
  onOpenChange,
  onCreated,
  lockedCategory = null,
}: ProductCreateDialogProps): ReactElement {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>(CATEGORY_NONE_VALUE)
  const [isActive, setIsActive] = useState(true)
  const [variants, setVariants] = useState<VariantDraft[]>(() => [newVariantRow()])
  const [options, setOptions] = useState<CategoryOptionRow[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true)
    try {
      const rows = await fetchCategoryOptions()
      setOptions(rows)
    } catch {
      setOptions([])
    } finally {
      setLoadingOptions(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      if (!lockedCategory) {
        void loadOptions()
      }
      setError(null)
    }
  }, [open, loadOptions, lockedCategory])

  useEffect(() => {
    if (open && lockedCategory) {
      setCategoryId(String(lockedCategory.id))
    }
  }, [open, lockedCategory])

  const categorySelectOptions = useMemo(
    () => [
      { value: CATEGORY_NONE_VALUE, label: '— None —' },
      ...options.map((o) => ({ value: String(o.id), label: o.name })),
    ],
    [options],
  )

  const reset = (): void => {
    setName('')
    setDescription('')
    setCategoryId(lockedCategory ? String(lockedCategory.id) : CATEGORY_NONE_VALUE)
    setIsActive(true)
    setVariants([newVariantRow()])
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)

    const variantPayload = variants.map((v) => {
      const cents = dollarsToCents(v.price)
      return { name: v.name.trim(), cents, sku: v.sku.trim(), is_active: v.is_active }
    })

    if (variantPayload.some((v) => v.name === '' || v.cents === null)) {
      setError('Each variant needs a name and a valid price.')
      return
    }

    setSubmitting(true)
    try {
      await createProduct({
        name: name.trim(),
        description: description.trim() || null,
        category_id:
          lockedCategory != null
            ? lockedCategory.id
            : categoryId === CATEGORY_NONE_VALUE
              ? null
              : Number(categoryId),
        is_active: isActive,
        variants: variantPayload.map((v) => ({
          name: v.name,
          price_cents: v.cents!,
          sku: v.sku === '' ? null : v.sku,
          is_active: v.is_active,
        })),
      })
      reset()
      onOpenChange(false)
      onCreated()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset()
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => void handleSubmit(e)}>
          <DialogHeader className="shrink-0 space-y-1.5 border-b border-border px-6 py-4 pe-14 text-start">
            <DialogTitle>{lockedCategory ? `New product in ${lockedCategory.name}` : 'New product'}</DialogTitle>
            <DialogDescription>
              {lockedCategory ? (
                <>
                  Products created here are added to <strong className="font-medium text-foreground">{lockedCategory.name}</strong> only.
                </>
              ) : null}{' '}
              Pricing lives on <strong className="font-medium text-foreground">variants</strong>. If the item has no
              sizes or options, use a single variant (for example <strong className="font-medium text-foreground">Standard</strong> or{' '}
              <strong className="font-medium text-foreground">Regular</strong>) — the API still requires at least one
              sellable variant.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="grid gap-4 px-6 py-4">
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {error}
              </div>
            ) : null}

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="product-name">
                Name
              </label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="product-desc">
                Description
              </label>
              <textarea
                id="product-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={cn(
                  'min-h-[80px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-[color,box-shadow]',
                  'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              />
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Category</span>
              {lockedCategory ? (
                <div
                  className={cn(
                    'flex h-9 w-full items-center rounded-md border border-border bg-muted-bg/50 px-3 py-2 text-sm text-foreground',
                  )}
                >
                  {lockedCategory.name}
                </div>
              ) : (
                <SearchableSelect
                  value={categoryId}
                  onValueChange={setCategoryId}
                  options={categorySelectOptions}
                  placeholder="— None —"
                  searchPlaceholder="Search categories…"
                  emptyText="No category found."
                  disabled={loadingOptions}
                />
              )}
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

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-semibold text-foreground">Variants</span>
                  <p className="mt-1 text-xs text-muted">
                    <strong className="font-medium text-foreground">Variant name</strong> — what the cashier sees (e.g.{' '}
                    <em>Large</em>, <em>Hot</em>). <strong className="font-medium text-foreground">SKU</strong> — your
                    stock-keeping code or barcode (optional).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVariants((prev) => [...prev, newVariantRow()])}
                >
                  Add variant
                </Button>
              </div>
              {variants.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-4 rounded-lg border border-border bg-muted-bg/30 p-3 sm:grid-cols-2"
                >
                  <div className="grid gap-1 sm:col-span-2">
                    <label className="text-xs font-medium text-muted">Variant name</label>
                    <Input
                      value={row.name}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-muted">Price (PHP)</label>
                    <Input
                      inputMode="decimal"
                      placeholder="0.00"
                      value={row.price}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((r) => (r.id === row.id ? { ...r, price: e.target.value } : r)),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-muted">SKU (optional)</label>
                    <Input
                      value={row.sku}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((r) => (r.id === row.id ? { ...r, sku: e.target.value } : r)),
                        )
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((r) => (r.id === row.id ? { ...r, is_active: e.target.checked } : r)),
                        )
                      }
                      className="size-4 rounded border-border"
                    />
                    Active
                  </label>
                  {variants.length > 1 ? (
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-700"
                        onClick={() => setVariants((prev) => prev.filter((r) => r.id !== row.id))}
                      >
                        Remove variant
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            </div>
          </ScrollArea>

          <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Create product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
