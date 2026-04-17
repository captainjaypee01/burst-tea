import type { ReactElement } from 'react'
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'

import { LineNoteInput } from '@/components/ordering/LineNoteInput'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { formatMoneyCents } from '@/lib/currency'
import type { Order, OrderItem } from '@/types/models'
import { cn } from '@/lib/utils'

export type OrderCartPanelProps = {
  order: Order | null
  loading?: boolean
  canEdit: boolean
  onChangeQty: (item: OrderItem, quantity: number) => void
  onCommitLineNote: (item: OrderItem, notes: string) => void
  onRemove: (item: OrderItem) => void
  onCheckout: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
  checkoutDisabled?: boolean
  /** When false, hides the collapse control (e.g. mobile sheet). Default true. */
  showCollapseToggle?: boolean
  /** `pos` = fixed-width menu layout (design brief); `standard` = legacy collapsible strip. */
  appearance?: 'standard' | 'pos'
  /** Thumbnails in cart lines when POS menu images are on. */
  showImages?: boolean
}

export function OrderCartPanel({
  order,
  loading,
  canEdit,
  onChangeQty,
  onCommitLineNote,
  onRemove,
  onCheckout,
  collapsed,
  onToggleCollapsed,
  checkoutDisabled,
  showCollapseToggle = true,
  appearance = 'standard',
  showImages = true,
}: OrderCartPanelProps): ReactElement {
  const items = order?.items ?? []
  const lineCount = items.reduce((n, i) => n + i.quantity, 0)

  if (appearance === 'pos') {
    return (
      <PosCartPanelBody
        order={order}
        loading={loading}
        canEdit={canEdit}
        items={items}
        lineCount={lineCount}
        onChangeQty={onChangeQty}
        onCommitLineNote={onCommitLineNote}
        onRemove={onRemove}
        onCheckout={onCheckout}
        checkoutDisabled={checkoutDisabled}
        showImages={showImages}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col border-card-border bg-sidebar transition-[width] duration-200 lg:border-l',
        collapsed ? 'lg:w-12 lg:min-w-[3rem]' : 'lg:w-[min(24rem,100%)] lg:min-w-[18rem]',
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-card-border px-3 py-2">
        <div className={cn('flex min-w-0 flex-1 items-center gap-2', collapsed && 'lg:justify-center')}>
          <ShoppingBag className="size-4 shrink-0 text-primary" aria-hidden />
          {!collapsed ? (
            <span className="truncate text-sm font-semibold text-foreground">Order summary</span>
          ) : (
            <span className="sr-only">Order summary collapsed</span>
          )}
        </div>
        {showCollapseToggle ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={collapsed ? 'Expand cart' : 'Collapse cart'}
            onClick={onToggleCollapsed}
          >
            {collapsed ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
          </Button>
        ) : null}
      </div>

      {!collapsed ? (
        <>
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-3 p-3">
              {loading ? <p className="text-sm text-muted">Loading…</p> : null}
              {!loading && items.length === 0 ? (
                <p className="text-sm text-muted">Add items from the menu.</p>
              ) : null}
              {items.map((item) => (
                <StandardLine
                  key={item.id}
                  item={item}
                  canEdit={canEdit}
                  loading={loading}
                  onChangeQty={onChangeQty}
                  onCommitLineNote={onCommitLineNote}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </ScrollArea>
          <div className="shrink-0 space-y-3 border-t border-card-border p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="tabular-nums font-medium text-foreground">
                {formatMoneyCents(order?.subtotal_cents ?? 0)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatMoneyCents(order?.total_cents ?? 0)}</span>
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={checkoutDisabled || !order || items.length === 0}
              onClick={onCheckout}
            >
              Checkout
            </Button>
          </div>
        </>
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center gap-1 border-t border-card-border py-4 lg:flex">
          <span className="sr-only">Items in cart</span>
          <span className="text-lg font-semibold tabular-nums text-foreground [writing-mode:vertical-rl]">
            {lineCount}
          </span>
        </div>
      )}
    </div>
  )
}

function StandardLine({
  item,
  canEdit,
  loading,
  onChangeQty,
  onCommitLineNote,
  onRemove,
}: {
  item: OrderItem
  canEdit: boolean
  loading?: boolean
  onChangeQty: (item: OrderItem, quantity: number) => void
  onCommitLineNote: (item: OrderItem, notes: string) => void
  onRemove: (item: OrderItem) => void
}): ReactElement {
  const label = item.variant?.product?.name
    ? `${item.variant.product.name} · ${item.variant.name}`
    : (item.variant?.name ?? `Variant #${item.product_variant_id}`)
  return (
    <div className="rounded-lg border border-card-border bg-card p-3 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-medium leading-snug text-foreground">{label}</p>
        {canEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label="Remove line"
            onClick={() => {
              onRemove(item)
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
      <p className="mt-1 tabular-nums text-xs text-muted-foreground">
        {formatMoneyCents(item.unit_price_cents)} each
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Qty</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Decrease quantity"
            disabled={!canEdit}
            onClick={() => {
              onChangeQty(item, item.quantity - 1)
            }}
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="min-w-[2rem] text-center tabular-nums text-sm">{item.quantity}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Increase quantity"
            disabled={!canEdit}
            onClick={() => {
              onChangeQty(item, item.quantity + 1)
            }}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
        <span className="ml-auto font-medium tabular-nums text-foreground">
          {formatMoneyCents(item.line_total_cents)}
        </span>
      </div>
      {canEdit ? (
        <LineNoteInput item={item} disabled={loading} onCommit={(notes) => onCommitLineNote(item, notes)} />
      ) : item.notes ? (
        <p className="mt-2 text-xs text-muted-foreground">Note: {item.notes}</p>
      ) : null}
    </div>
  )
}

function PosCartPanelBody({
  order,
  loading,
  canEdit,
  items,
  lineCount,
  onChangeQty,
  onCommitLineNote,
  onRemove,
  onCheckout,
  checkoutDisabled,
  showImages,
}: {
  order: Order | null
  loading?: boolean
  canEdit: boolean
  items: OrderItem[]
  lineCount: number
  onChangeQty: (item: OrderItem, quantity: number) => void
  onCommitLineNote: (item: OrderItem, notes: string) => void
  onRemove: (item: OrderItem) => void
  onCheckout: () => void
  checkoutDisabled?: boolean
  showImages: boolean
}): ReactElement {
  const empty = items.length === 0

  return (
    <aside className="flex h-full min-h-0 max-h-full w-full min-w-0 shrink-0 flex-col overflow-hidden border-border/10 bg-card lg:max-h-[calc(100dvh-3.5rem)] lg:w-[360px] lg:min-w-[360px] lg:border-l">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/8 px-5">
        <h2 className="font-display text-lg font-semibold text-foreground">Order Summary</h2>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
            empty ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground',
          )}
        >
          {lineCount} items
        </span>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 basis-0 touch-pan-y overflow-y-auto overscroll-contain">
        <div className="space-y-3 px-5 py-4">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {!loading && empty ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/6 text-primary">
                <ShoppingBag className="size-6" aria-hidden />
              </div>
              <p className="text-sm font-medium text-primary">Cart is empty</p>
              <p className="max-w-[14rem] text-xs text-muted-foreground">Pick variants on the left…</p>
            </div>
          ) : null}
          {!loading &&
            items.map((item) => {
              const title = item.variant?.product?.name ?? 'Item'
              const variantName = item.variant?.name ?? 'Variant'
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/8 bg-background p-3 text-sm shadow-sm"
                >
                  <div className="flex gap-3">
                    {showImages ? (
                      <div
                        className="flex size-14 shrink-0 items-center justify-center rounded-md bg-secondary font-display text-lg font-semibold text-primary/30"
                        aria-hidden
                      >
                        {title.slice(0, 1)}
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-snug text-foreground">{title}</p>
                        {canEdit ? (
                          <button
                            type="button"
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                            aria-label="Remove line"
                            onClick={() => onRemove(item)}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {variantName} · {formatMoneyCents(item.unit_price_cents)} each
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="inline-flex items-center overflow-hidden rounded-md border border-border/15 bg-card">
                          <button
                            type="button"
                            className="flex size-7 items-center justify-center text-primary disabled:opacity-40"
                            aria-label="Decrease quantity"
                            disabled={!canEdit}
                            onClick={() => onChangeQty(item, item.quantity - 1)}
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="min-w-6 text-center text-xs font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="flex size-7 items-center justify-center text-primary disabled:opacity-40"
                            aria-label="Increase quantity"
                            disabled={!canEdit}
                            onClick={() => onChangeQty(item, item.quantity + 1)}
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-medium tabular-nums text-foreground">
                          {formatMoneyCents(item.line_total_cents)}
                        </span>
                      </div>
                      {canEdit ? (
                        <LineNoteInput
                          mode="ghost"
                          item={item}
                          disabled={loading}
                          onCommit={(notes) => onCommitLineNote(item, notes)}
                        />
                      ) : item.notes ? (
                        <p className="text-[11px] text-muted-foreground">Note: {item.notes}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/8 bg-card px-6 pb-6 pt-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-primary/65">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatMoneyCents(order?.subtotal_cents ?? 0)}</span>
          </div>
          {/* VAT (12%) — re-enable when tax display is finalized
          <div className="flex justify-between text-primary/65">
            <span>VAT (12%)</span>
            <span className="tabular-nums">{formatMoneyCents(order?.tax_cents ?? 0)}</span>
          </div>
          */}
          <Separator className="my-2 bg-border/10" />
          <div className="flex items-end justify-between pt-1">
            <span className="text-sm font-medium text-foreground">Total</span>
            <span className="font-display text-2xl font-semibold tabular-nums text-secondary-foreground">
              {formatMoneyCents(order?.total_cents ?? 0)}
            </span>
          </div>
        </div>
        <Button
          type="button"
          className="mt-4 h-12 w-full rounded-md text-sm font-medium disabled:cursor-not-allowed disabled:bg-primary/15 disabled:opacity-100 disabled:text-muted-foreground"
          disabled={checkoutDisabled || !order || items.length === 0}
          onClick={onCheckout}
        >
          Checkout
        </Button>
        <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
          Next step: Cash · Maya · GCash
        </p>
      </div>
    </aside>
  )
}
