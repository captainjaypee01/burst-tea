import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'
import { toast } from 'sonner'

import { fetchCategoryOptions } from '@/api/categories'
import type { CategoryOptionRow } from '@/api/categories'
import {
  createVariant,
  deleteProduct,
  deleteVariant,
  updateProduct,
  updateVariant,
} from '@/api/products'
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
import { PERMISSIONS } from '@/constants/permissions'
import { useProduct } from '@/hooks/useProduct'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoneyCents } from '@/lib/currency'
import { hasPermission } from '@/lib/hasPermission'
import { centsToDollarsString, dollarsToCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { ProductVariant } from '@/types/models'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CATEGORY_NONE_VALUE } from '@/constants/catalog'

export type ProductDetailLocationState = {
  fromCategory?: { id: number; name: string }
}

export function ProductDetailPage(): ReactElement {
  const params = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const fromCategory = (location.state as ProductDetailLocationState | null)?.fromCategory
  const productId = Number(params.productId)
  const user = useAuthStore((s) => s.user)

  const canRead = hasPermission(PERMISSIONS.PRODUCT_READ, user)
  const canUpdate = hasPermission(PERMISSIONS.PRODUCT_UPDATE, user)
  const canDelete = hasPermission(PERMISSIONS.PRODUCT_DELETE, user)

  const { product, loading, error, reload } = useProduct(Number.isFinite(productId) ? productId : undefined)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState(CATEGORY_NONE_VALUE)
  const [isActive, setIsActive] = useState(true)
  const [savingProduct, setSavingProduct] = useState(false)
  const [productFormError, setProductFormError] = useState<string | null>(null)

  const [options, setOptions] = useState<CategoryOptionRow[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const [variantDialog, setVariantDialog] = useState<'add' | 'edit' | null>(null)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [vName, setVName] = useState('')
  const [vPrice, setVPrice] = useState('')
  const [vSku, setVSku] = useState('')
  const [vActive, setVActive] = useState(true)
  const [savingVariant, setSavingVariant] = useState(false)
  const [variantError, setVariantError] = useState<string | null>(null)

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
    void loadOptions()
  }, [loadOptions])

  const categorySelectOptions = useMemo(
    () => [
      { value: CATEGORY_NONE_VALUE, label: '— None —' },
      ...options.map((o) => ({ value: String(o.id), label: o.name })),
    ],
    [options],
  )

  useEffect(() => {
    if (!product) {
      return
    }
    setName(product.name)
    setDescription(product.description ?? '')
    setCategoryId(product.category_id == null ? CATEGORY_NONE_VALUE : String(product.category_id))
    setIsActive(product.is_active)
  }, [product])

  const openAddVariant = (): void => {
    setEditingVariant(null)
    setVName('')
    setVPrice('')
    setVSku('')
    setVActive(true)
    setVariantError(null)
    setVariantDialog('add')
  }

  const openEditVariant = (v: ProductVariant): void => {
    setEditingVariant(v)
    setVName(v.name)
    setVPrice(centsToDollarsString(v.price_cents))
    setVSku(v.sku ?? '')
    setVActive(v.is_active)
    setVariantError(null)
    setVariantDialog('edit')
  }

  const saveProduct = async (): Promise<void> => {
    if (!product) {
      return
    }
    setProductFormError(null)
    setSavingProduct(true)
    try {
      await updateProduct(product.id, {
        name: name.trim(),
        description: description.trim() || null,
        category_id: categoryId === CATEGORY_NONE_VALUE ? null : Number(categoryId),
        is_active: isActive,
      })
      await reload()
      toast.success('Product saved')
    } catch (err) {
      setProductFormError(getApiErrorMessage(err))
    } finally {
      setSavingProduct(false)
    }
  }

  const removeProduct = async (): Promise<void> => {
    if (!product) {
      return
    }
    if (!window.confirm(`Remove product “${product.name}”? It will be archived (soft-deleted).`)) {
      return
    }
    try {
      await deleteProduct(product.id)
      navigate(fromCategory != null ? `/categories/${fromCategory.id}` : '/products')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const saveVariant = async (): Promise<void> => {
    if (!product) {
      return
    }
    setVariantError(null)
    const cents = dollarsToCents(vPrice)
    if (vName.trim() === '' || cents === null) {
      setVariantError('Name and a valid price are required.')
      return
    }
    setSavingVariant(true)
    try {
      if (variantDialog === 'add') {
        await createVariant(product.id, {
          name: vName.trim(),
          price_cents: cents,
          sku: vSku.trim() === '' ? null : vSku.trim(),
          is_active: vActive,
        })
      } else if (variantDialog === 'edit' && editingVariant) {
        await updateVariant(product.id, editingVariant.id, {
          name: vName.trim(),
          price_cents: cents,
          sku: vSku.trim() === '' ? null : vSku.trim(),
          is_active: vActive,
        })
      }
      setVariantDialog(null)
      await reload()
      toast.success(variantDialog === 'add' ? 'Variant added' : 'Variant updated')
    } catch (err) {
      setVariantError(getApiErrorMessage(err))
    } finally {
      setSavingVariant(false)
    }
  }

  const removeVariant = async (v: ProductVariant): Promise<void> => {
    if (!product) {
      return
    }
    if (!window.confirm(`Remove variant “${v.name}”?`)) {
      return
    }
    try {
      await deleteVariant(product.id, v.id)
      await reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  if (!Number.isFinite(productId)) {
    return (
      <div className="text-sm text-muted">
        Invalid product. <Link className="text-accent underline" to="/products">Back to products</Link>
      </div>
    )
  }

  if (!canRead) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        You do not have permission to view this product.
      </div>
    )
  }

  if (loading && !product) {
    return <div className="text-sm text-muted">Loading…</div>
  }

  if (error || !product) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error ?? 'Not found.'}</div>
        <Link className="text-sm text-accent underline" to="/products">
          Back to products
        </Link>
      </div>
    )
  }

  const variants = product.variants ?? []

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <Button type="button" variant="outline" size="sm" className="w-fit max-w-full border-card-border" asChild>
          <Link
            to={fromCategory != null ? `/categories/${fromCategory.id}` : '/products'}
            className="inline-flex min-w-0 max-w-full items-center gap-2"
            title={fromCategory != null ? `Back to ${fromCategory.name}` : 'Back to products'}
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            <span className="truncate">
              {fromCategory != null ? fromCategory.name : 'Products'}
            </span>
          </Link>
        </Button>
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
            <Package className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{product.name}</h1>
            <p className="mt-1 text-sm text-muted">Edit product details and variants.</p>
          </div>
        </div>
      </div>

      <section className="space-y-4 rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Details</h2>
        {productFormError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{productFormError}</div>
        ) : null}
        <div className="grid max-w-xl gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium" htmlFor="p-name">
              Name
            </label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} disabled={!canUpdate} />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium" htmlFor="p-desc">
              Description
            </label>
            <textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canUpdate}
              rows={3}
              className={cn(
                'min-h-[80px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none',
                'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
                !canUpdate && 'opacity-60',
              )}
            />
          </div>
          <div className="grid gap-1">
            <span className="text-sm font-medium">Category</span>
            <SearchableSelect
              value={categoryId}
              onValueChange={setCategoryId}
              options={categorySelectOptions}
              placeholder="— None —"
              searchPlaceholder="Search categories…"
              emptyText="No category found."
              disabled={!canUpdate || loadingOptions}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={!canUpdate}
              className="size-4 rounded border-border"
            />
            Active
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate ? (
            <Button type="button" onClick={() => void saveProduct()} disabled={savingProduct}>
              {savingProduct ? 'Saving…' : 'Save changes'}
            </Button>
          ) : null}
          {canDelete ? (
            <Button type="button" variant="outline" className="border-red-200 text-red-800" onClick={() => void removeProduct()}>
              Remove product
            </Button>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Variants</h2>
            <p className="mt-1 max-w-2xl text-xs text-muted">
              Use one variant (e.g. <strong className="font-medium text-foreground">Standard</strong>) when there are no
              size or option differences. <strong className="font-medium text-foreground">SKU</strong> is your internal or
              barcode id; <strong className="font-medium text-foreground">variant name</strong> is what staff see on the
              register.
            </p>
          </div>
          {canUpdate ? (
            <Button type="button" variant="outline" size="sm" onClick={openAddVariant}>
              Add variant
            </Button>
          ) : null}
        </div>
        <div className="overflow-hidden rounded-xl border border-card-border bg-card shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-card-border bg-muted-bg">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Active</th>
                {canUpdate ? <th className="px-4 py-3 text-end text-xs font-semibold uppercase tracking-wider text-muted" /> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-[color-mix(in_oklab,var(--color-border)_70%,transparent)]">
              {variants.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted" colSpan={canUpdate ? 5 : 4}>
                    No variants.
                  </td>
                </tr>
              ) : (
                variants.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-3">{v.name}</td>
                    <td className="px-4 py-3 tabular-nums">{formatMoneyCents(v.price_cents)}</td>
                    <td className="px-4 py-3 text-muted">{v.sku ?? '—'}</td>
                    <td className="px-4 py-3">{v.is_active ? 'Yes' : 'No'}</td>
                    {canUpdate ? (
                      <td className="px-4 py-3 text-end">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 border border-border bg-card shadow-sm"
                            onClick={() => openEditVariant(v)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 border border-red-300 bg-card text-red-800 shadow-sm hover:bg-red-50"
                            onClick={() => void removeVariant(v)}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={variantDialog !== null} onOpenChange={(o) => !o && setVariantDialog(null)}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 space-y-1.5 border-b border-border px-6 py-4 pe-14 text-start">
            <DialogTitle>{variantDialog === 'add' ? 'Add variant' : 'Edit variant'}</DialogTitle>
            <DialogDescription>
              Example: name <strong className="font-medium text-foreground">Large</strong> or{' '}
              <strong className="font-medium text-foreground">Standard</strong>; SKU{' '}
              <strong className="font-medium text-foreground">SKU-MILK-1L</strong> for scanning or stock tracking.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="min-h-0 max-h-[min(60vh,calc(90vh-10rem))]">
            <div className="grid gap-3 px-6 py-4">
              {variantError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{variantError}</div>
              ) : null}
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="v-name">
                  Variant name
                </label>
                <Input id="v-name" value={vName} onChange={(e) => setVName(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="v-price">
                  Price (PHP)
                </label>
                <Input id="v-price" inputMode="decimal" value={vPrice} onChange={(e) => setVPrice(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="v-sku">
                  SKU (optional)
                </label>
                <Input id="v-sku" value={vSku} onChange={(e) => setVSku(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={vActive}
                  onChange={(e) => setVActive(e.target.checked)}
                  className="size-4 rounded border-border"
                />
                Active
              </label>
            </div>
          </ScrollArea>
          <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setVariantDialog(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={savingVariant} onClick={() => void saveVariant()}>
              {savingVariant ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductDetailPage
