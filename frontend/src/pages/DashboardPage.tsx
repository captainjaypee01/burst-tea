import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, FolderTree, Landmark, Package, ShoppingCart, Store, Wallet } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'

export function DashboardPage(): ReactElement {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Overview for staff.           Jump to <strong className="font-medium text-foreground">orders</strong>,{' '}
          <strong className="font-medium text-foreground">catalog</strong> (categories and products), or{' '}
          <strong className="font-medium text-foreground">shift and cash</strong> (session and registers). Customer
          self-order screens can mirror the same catalog later without changing your data model.
        </p>
        <p className="mt-3 text-sm text-muted">
          Signed in as <span className="font-medium text-foreground">{user?.name}</span>
          {user?.email ? <span> · {user.email}</span> : null}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          to="/orders"
          className="group relative overflow-hidden rounded-2xl border border-card-border bg-card p-6 shadow-sm transition hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-card-border))] hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
              <ShoppingCart className="size-6" aria-hidden />
            </div>
            <ArrowUpRight className="size-5 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Orders</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">Review and manage POS orders, pagination, and status.</p>
        </Link>

        <Link
          to="/pos/new"
          className="group relative overflow-hidden rounded-2xl border border-card-border bg-card p-6 shadow-sm transition hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-card-border))] hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
              <Store className="size-6" aria-hidden />
            </div>
            <ArrowUpRight className="size-5 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">New order</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">POS menu, cart, and checkout — separate from the orders table.</p>
        </Link>

        <Link
          to="/categories"
          className="group relative overflow-hidden rounded-2xl border border-card-border bg-card p-6 shadow-sm transition hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-card-border))] hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
              <FolderTree className="size-6" aria-hidden />
            </div>
            <ArrowUpRight className="size-5 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Categories</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">Menu groupings; open a category to see its products.</p>
        </Link>

        <Link
          to="/products"
          className="group relative overflow-hidden rounded-2xl border border-card-border bg-card p-6 shadow-sm transition hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-card-border))] hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
              <Package className="size-6" aria-hidden />
            </div>
            <ArrowUpRight className="size-5 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Products</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">Browse products and variants for the register.</p>
        </Link>

        <Link
          to="/shifts/session"
          className="group relative overflow-hidden rounded-2xl border border-card-border bg-card p-6 shadow-sm transition hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-card-border))] hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
              <Wallet className="size-6" aria-hidden />
            </div>
            <ArrowUpRight className="size-5 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Shift session</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">Open or close your shift, expenses, advances, and cash ledger.</p>
        </Link>

        <Link
          to="/cash-registers"
          className="group relative overflow-hidden rounded-2xl border border-card-border bg-card p-6 shadow-sm transition hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-card-border))] hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_12%,white)] text-accent">
              <Landmark className="size-6" aria-hidden />
            </div>
            <ArrowUpRight className="size-5 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Cash registers</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">Manage drawers and open shift history per register.</p>
        </Link>
      </div>
    </div>
  )
}

export default DashboardPage
