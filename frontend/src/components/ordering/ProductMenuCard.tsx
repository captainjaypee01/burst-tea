import { type ReactElement, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { formatMoneyCents } from '@/lib/currency'
import type { Product, ProductVariant } from '@/types/models'
import { cn } from '@/lib/utils'

export type ProductMenuCardProps = {
  product: Product
  onPickVariant: (variant: ProductVariant) => void
  disabled?: boolean
  /** Show 4:3 image strip + tag badge; otherwise compact text card. */
  showImages?: boolean
  /** Espresso “bundle / promo” card treatment. */
  featured?: boolean
}

function sellable(product: Product): ProductVariant[] {
  return (product.variants ?? []).filter((v) => v.is_active)
}

function tagLabel(product: Product, featured: boolean): string {
  if (featured) {
    return 'Featured'
  }
  if (product.category?.name && product.category.name.length > 0) {
    return product.category.name.slice(0, 14).toUpperCase()
  }
  return 'MENU'
}

export function ProductMenuCard({
  product,
  onPickVariant,
  disabled,
  showImages = true,
  featured = false,
}: ProductMenuCardProps): ReactElement {
  const variants = sellable(product)
  const tag = tagLabel(product, featured)

  const baseCard = cn(
    'group flex h-full flex-col overflow-hidden rounded-xl border transition-shadow',
    featured
      ? 'border-primary bg-primary text-primary-foreground shadow-none'
      : 'border-border/10 bg-card text-foreground shadow-sm',
  )

  const variantBtnBase = cn(
    'rounded-md border text-left transition-colors',
    featured
      ? 'border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15'
      : 'border-border/10 bg-secondary/50 hover:bg-secondary/80',
  )

  return (
    <div className={baseCard}>
      {showImages ? (
        <>
          <div
            className={cn(
              'relative aspect-[4/3] overflow-hidden',
              featured ? 'bg-primary/80' : 'bg-secondary',
            )}
          >
            <div
              className="flex h-full w-full items-center justify-center transition-transform duration-500 group-hover:scale-105"
              aria-hidden
            >
              <span
                className={cn(
                  'font-display text-4xl font-semibold select-none',
                  featured ? 'text-primary-foreground/35' : 'text-primary/20',
                )}
              >
                {product.name.slice(0, 1)}
              </span>
            </div>
            <div className="absolute left-3 top-3">
              <span
                className={cn(
                  'inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  featured
                    ? 'bg-primary-foreground/15 text-primary-foreground'
                    : 'bg-card/95 text-primary',
                )}
              >
                {tag}
              </span>
            </div>
          </div>
          <div className="flex flex-col p-4">
            <p
              className={cn(
                'font-display text-base font-semibold leading-snug',
                featured ? 'text-primary-foreground' : 'text-secondary-foreground',
              )}
            >
              {product.name}
            </p>
            {product.description ? (
              <p
                className={cn(
                  'mt-1 line-clamp-3 flex-1 text-xs leading-relaxed',
                  featured ? 'text-primary-foreground/75' : 'text-muted-foreground',
                )}
              >
                {product.description}
              </p>
            ) : (
              <div className="flex-1" />
            )}
            <VariantBlock
              key={product.id}
              featured={featured}
              variants={variants}
              variantBtnBase={variantBtnBase}
              disabled={disabled}
              onPickVariant={onPickVariant}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col space-y-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p
              className={cn(
                'font-display text-base font-semibold',
                featured ? 'text-primary-foreground' : 'text-secondary-foreground',
              )}
            >
              {product.name}
            </p>
            <span
              className={cn(
                'inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase',
                featured
                  ? 'bg-primary-foreground/15 text-primary-foreground'
                  : 'bg-secondary text-primary',
              )}
            >
              {tag}
            </span>
          </div>
          {product.description ? (
            <p
              className={cn(
                'text-xs leading-relaxed',
                featured ? 'text-primary-foreground/75' : 'text-muted-foreground',
              )}
            >
              {product.description}
            </p>
          ) : null}
          <VariantBlock
            key={product.id}
            featured={featured}
            variants={variants}
            variantBtnBase={variantBtnBase}
            disabled={disabled}
            onPickVariant={onPickVariant}
          />
        </div>
      )}
    </div>
  )
}

function VariantBlock({
  featured,
  variants,
  variantBtnBase,
  disabled,
  onPickVariant,
}: {
  featured: boolean
  variants: ProductVariant[]
  variantBtnBase: string
  disabled?: boolean
  onPickVariant: (v: ProductVariant) => void
}): ReactElement {
  const muted = featured ? 'text-primary-foreground/75' : 'text-muted-foreground'
  const n = variants.length

  return (
    <div
      className={cn(
        'mt-3 border-t pt-3',
        featured ? 'border-primary-foreground/15' : 'border-border/8',
      )}
    >
      {n === 0 ? (
        <p className={cn('text-xs', muted)}>No sellable variants.</p>
      ) : n === 1 ? (
        <button
          type="button"
          disabled={disabled}
          className={cn('flex h-10 w-full items-center justify-between px-3 text-sm', variantBtnBase)}
          onClick={() => {
            onPickVariant(variants[0]!)
          }}
        >
          <span className="font-medium tabular-nums">{formatMoneyCents(variants[0]!.price_cents)}</span>
          <span className="text-xs font-medium">Add +</span>
        </button>
      ) : n === 2 ? (
        <div className="grid grid-cols-2 gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={disabled}
              className={cn('h-14 rounded-md px-3 py-1.5 text-left', variantBtnBase)}
              onClick={() => {
                onPickVariant(v)
              }}
            >
              <span className={cn('block text-[11px]', muted)}>{v.name}</span>
              <span className="text-sm font-medium tabular-nums">{formatMoneyCents(v.price_cents)}</span>
            </button>
          ))}
        </div>
      ) : (
        <VariantCarouselWithArrows
          featured={featured}
          variants={variants}
          variantBtnBase={variantBtnBase}
          disabled={disabled}
          mutedClass={muted}
          onPickVariant={onPickVariant}
        />
      )}
    </div>
  )
}

const VARIANTS_PER_PAGE = 2

/** 3+ variants: show two per page; arrows change page (not single-variant steps). */
function VariantCarouselWithArrows({
  featured,
  variants,
  variantBtnBase,
  disabled,
  mutedClass,
  onPickVariant,
}: {
  featured: boolean
  variants: ProductVariant[]
  variantBtnBase: string
  disabled?: boolean
  mutedClass: string
  onPickVariant: (v: ProductVariant) => void
}): ReactElement {
  const len = variants.length
  const pageCount = Math.max(1, Math.ceil(len / VARIANTS_PER_PAGE))
  const [page, setPage] = useState(0)
  const safePage = Math.min(page, pageCount - 1)
  const start = safePage * VARIANTS_PER_PAGE
  const pageVariants = variants.slice(start, start + VARIANTS_PER_PAGE)

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="grid min-w-0 grid-cols-2 gap-2">
        {pageVariants.map((v) => (
          <button
            key={v.id}
            type="button"
            disabled={disabled}
            className={cn(
              'h-14 rounded-md px-3 py-1.5 text-left',
              variantBtnBase,
              pageVariants.length === 1 ? 'col-span-2' : '',
            )}
            onClick={() => {
              onPickVariant(v)
            }}
          >
            <span className={cn('block text-[11px]', mutedClass)}>{v.name}</span>
            <span className="text-sm font-medium tabular-nums">{formatMoneyCents(v.price_cents)}</span>
          </button>
        ))}
      </div>
      {pageCount > 1 ? (
        <div
          className={cn(
            'flex items-center justify-center gap-1.5 text-[10px] leading-none tabular-nums',
            mutedClass,
          )}
        >
          <button
            type="button"
            disabled={disabled}
            aria-label="Previous page"
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded p-0.5 transition-colors',
              featured
                ? 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground',
            )}
            onClick={() => {
              setPage((p) => {
                const cur = Math.min(p, pageCount - 1)
                return (cur - 1 + pageCount) % pageCount
              })
            }}
          >
            <ChevronLeft className="size-[1em]" strokeWidth={2} aria-hidden />
          </button>
          <span>
            Page {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={disabled}
            aria-label="Next page"
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded p-0.5 transition-colors',
              featured
                ? 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground',
            )}
            onClick={() => {
              setPage((p) => {
                const cur = Math.min(p, pageCount - 1)
                return (cur + 1) % pageCount
              })
            }}
          >
            <ChevronRight className="size-[1em]" strokeWidth={2} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  )
}
