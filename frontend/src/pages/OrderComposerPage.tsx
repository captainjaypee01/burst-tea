import { type ReactElement, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PanelRight } from 'lucide-react'
import { toast } from 'sonner'

import { OrderCartPanel } from '@/components/ordering/OrderCartPanel'
import { ProductMenuCard } from '@/components/ordering/ProductMenuCard'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { PERMISSIONS } from '@/constants/permissions'
import { useCategoryOptions } from '@/hooks/useCategoryOptions'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useOrder } from '@/hooks/useOrder'
import { useProducts } from '@/hooks/useProducts'
import { addOrderItem, createOrder, deleteOrderItem, updateOrderItem } from '@/api/orders'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoneyCents } from '@/lib/currency'
import { hasPermission } from '@/lib/hasPermission'
import { useAuthStore } from '@/stores/authStore'
import type { OrderItem, Product, ProductVariant } from '@/types/models'
import { cn } from '@/lib/utils'

function isFeaturedProduct(product: Product): boolean {
  const n = product.name.toLowerCase()
  return n.includes('barkada') || n.includes('bundle') || n.includes('meal')
}

export function OrderComposerPage(): ReactElement {
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)

  const routeOrderId = params.orderId != null && /^\d+$/.test(params.orderId) ? Number(params.orderId) : undefined

  const search = searchParams.get('q') ?? ''
  const deferredSearch = useDeferredValue(search)
  const showImages = searchParams.get('img') !== '0'

  const canReadCatalog =
    hasPermission(PERMISSIONS.CATEGORY_READ, user) && hasPermission(PERMISSIONS.PRODUCT_READ, user)
  const canCreateOrder = hasPermission(PERMISSIONS.ORDER_CREATE, user)
  const canUpdateOrder = hasPermission(PERMISSIONS.ORDER_UPDATE, user)

  const { categories, loading: loadingCats, error: catError } = useCategoryOptions(canReadCatalog)
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)

  useEffect(() => {
    if (categories.length > 0 && activeCategoryId === null) {
      setActiveCategoryId(categories[0].id)
    }
  }, [categories, activeCategoryId])

  const { order, loading: loadingOrder, error: orderError, reload: reloadOrder } = useOrder(routeOrderId, {
    enabled: canCreateOrder && routeOrderId !== undefined,
  })

  useEffect(() => {
    if (order?.status === 'cancelled' && routeOrderId !== undefined) {
      toast.message('This order was cancelled — starting a new order.')
      navigate('/pos/new', { replace: true })
    }
  }, [order?.status, routeOrderId, navigate])

  const {
    data: products,
    loading: loadingProducts,
    error: productsError,
    reload: reloadProducts,
  } = useProducts(100, {
    categoryId: activeCategoryId ?? undefined,
    enabled: canReadCatalog && activeCategoryId !== null,
    search: deferredSearch,
  })

  const [busy, setBusy] = useState(false)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const isLg = useMediaQuery('(min-width: 1024px)')

  const addVariant = useCallback(
    async (variant: ProductVariant) => {
      if (!canCreateOrder || !canUpdateOrder) {
        return
      }
      setBusy(true)
      try {
        if (routeOrderId === undefined) {
          const created = await createOrder({
            items: [{ product_variant_id: variant.id, quantity: 1 }],
          })
          toast.success('Order started')
          navigate(`/pos/${created.id}/compose`, { replace: true })
          return
        }
        await addOrderItem(routeOrderId, { product_variant_id: variant.id, quantity: 1 })
        await reloadOrder()
        await reloadProducts()
        toast.success('Added to order')
      } catch (err) {
        toast.error(getApiErrorMessage(err))
      } finally {
        setBusy(false)
      }
    },
    [canCreateOrder, canUpdateOrder, routeOrderId, navigate, reloadOrder, reloadProducts],
  )

  const onChangeQty = useCallback(
    async (item: OrderItem, quantity: number) => {
      if (!routeOrderId || !canUpdateOrder) {
        return
      }
      if (quantity < 1) {
        setBusy(true)
        try {
          await deleteOrderItem(routeOrderId, item.id)
          await reloadOrder()
        } catch (err) {
          toast.error(getApiErrorMessage(err))
        } finally {
          setBusy(false)
        }
        return
      }
      setBusy(true)
      try {
        await updateOrderItem(routeOrderId, item.id, { quantity, notes: item.notes })
        await reloadOrder()
      } catch (err) {
        toast.error(getApiErrorMessage(err))
      } finally {
        setBusy(false)
      }
    },
    [routeOrderId, canUpdateOrder, reloadOrder],
  )

  const onCommitLineNote = useCallback(
    async (item: OrderItem, notes: string) => {
      if (!routeOrderId || !canUpdateOrder) {
        return
      }
      const next = notes.trim() === '' ? null : notes.trim()
      const prev = item.notes?.trim() ?? null
      if (next === prev) {
        return
      }
      setBusy(true)
      try {
        await updateOrderItem(routeOrderId, item.id, { quantity: item.quantity, notes: next })
        await reloadOrder()
      } catch (err) {
        toast.error(getApiErrorMessage(err))
      } finally {
        setBusy(false)
      }
    },
    [routeOrderId, canUpdateOrder, reloadOrder],
  )

  const onRemove = useCallback(
    async (item: OrderItem) => {
      if (!routeOrderId || !canUpdateOrder) {
        return
      }
      setBusy(true)
      try {
        await deleteOrderItem(routeOrderId, item.id)
        await reloadOrder()
      } catch (err) {
        toast.error(getApiErrorMessage(err))
      } finally {
        setBusy(false)
      }
    },
    [routeOrderId, canUpdateOrder, reloadOrder],
  )

  const onCheckout = useCallback(() => {
    if (!routeOrderId || !order || (order.items?.length ?? 0) === 0) {
      return
    }
    navigate(`/pos/${routeOrderId}/checkout`)
  }, [navigate, routeOrderId, order])

  const lineCount = useMemo(() => {
    return (order?.items ?? []).reduce((n, i) => n + i.quantity, 0)
  }, [order?.items])

  const checkoutDisabled =
    busy || !routeOrderId || !order || (order.items?.length ?? 0) === 0 || order.status !== 'open'

  const cartPanelProps = {
    order: order ?? null,
    loading: loadingOrder,
    canEdit: canUpdateOrder,
    onChangeQty: (item: OrderItem, q: number) => void onChangeQty(item, q),
    onCommitLineNote: (item: OrderItem, notes: string) => void onCommitLineNote(item, notes),
    onRemove: (item: OrderItem) => void onRemove(item),
    onCheckout,
    collapsed: false,
    onToggleCollapsed: (): void => {},
    checkoutDisabled,
    showCollapseToggle: false,
    appearance: 'pos' as const,
    showImages,
  }

  if (!canReadCatalog) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-lg border border-border/15 bg-card px-4 py-3 text-sm text-foreground">
          You need category and product access to use the ordering menu.
        </div>
      </div>
    )
  }

  if (!canCreateOrder || !canUpdateOrder) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-lg border border-border/15 bg-card px-4 py-3 text-sm text-foreground">
          You need permission to create and update orders for the POS composer.
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 basis-0 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden">
          <div className="scrollbar-thin min-h-0 flex-1 basis-0 touch-pan-y overflow-y-auto overscroll-contain px-6 py-6 lg:px-10 lg:py-8">
            <h1 className="font-display text-3xl font-semibold text-secondary-foreground">New Order</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Pick variants on cards, edit lines in the summary, then checkout.{' '}
              <Link className="text-primary underline-offset-2 hover:underline" to="/orders">
                Orders list
              </Link>
            </p>

            {catError ? (
              <div className="mt-4 rounded-lg border border-destructive/20 bg-card px-4 py-3 text-sm text-destructive">
                {catError}
              </div>
            ) : null}
            {orderError ? (
              <div className="mt-4 rounded-lg border border-destructive/20 bg-card px-4 py-3 text-sm text-destructive">
                {orderError}
              </div>
            ) : null}
            {productsError ? (
              <div className="mt-4 rounded-lg border border-destructive/20 bg-card px-4 py-3 text-sm text-destructive">
                {productsError}
              </div>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-2">
              {loadingCats ? <span className="text-xs text-muted-foreground">Loading categories…</span> : null}
              {!loadingCats &&
                categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={cn(
                      'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-xs font-medium transition-colors',
                      activeCategoryId === c.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/18 bg-card text-primary',
                    )}
                    onClick={() => {
                      setActiveCategoryId(c.id)
                    }}
                  >
                    {c.name}
                  </button>
                ))}
            </div>

            <div
              className={cn(
                'mt-6 grid min-h-0 gap-5',
                showImages ? '' : 'max-w-4xl grid-cols-1 sm:grid-cols-2',
              )}
              style={
                showImages
                  ? { gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }
                  : undefined
              }
            >
              {loadingProducts ? <p className="text-sm text-muted-foreground">Loading products…</p> : null}
              {!loadingProducts &&
                products.map((p) => (
                  <ProductMenuCard
                    key={p.id}
                    product={p}
                    disabled={busy}
                    showImages={showImages}
                    featured={isFeaturedProduct(p)}
                    onPickVariant={(v) => void addVariant(v)}
                  />
                ))}
            </div>
          </div>
        </div>

        {isLg ? (
          <div className="flex min-h-0 shrink-0 flex-col lg:h-full lg:max-h-full lg:w-[360px] lg:min-w-[360px] lg:overflow-hidden">
            <OrderCartPanel {...cartPanelProps} />
          </div>
        ) : null}
      </div>

      {!isLg ? (
        <>
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/10 bg-card/95 px-4 py-3 backdrop-blur-md">
            <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{lineCount} items</p>
                <p className="text-base font-semibold tabular-nums text-foreground">
                  {formatMoneyCents(order?.total_cents ?? 0)}
                </p>
              </div>
              <Button type="button" className="gap-2" onClick={() => setMobileCartOpen(true)}>
                <PanelRight className="size-4" />
                Cart
              </Button>
            </div>
          </div>
          <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
            <SheetContent side="right" className="flex w-[min(22rem,92vw)] flex-col gap-0 overflow-hidden p-0">
              <div className="flex max-h-dvh min-h-0 flex-1 flex-col">
                <OrderCartPanel {...cartPanelProps} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="h-16 shrink-0" aria-hidden />
        </>
      ) : null}
    </div>
  )
}

export default OrderComposerPage
