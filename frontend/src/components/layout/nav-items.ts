import { FolderTree, Landmark, LayoutDashboard, Package, ShoppingCart, Store, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  description: string
  icon: LucideIcon
}

export const staffNavItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    description: 'Overview & shortcuts',
    icon: LayoutDashboard,
  },
  {
    to: '/orders',
    label: 'Orders',
    description: 'POS orders & payments',
    icon: ShoppingCart,
  },
  {
    to: '/pos/new',
    label: 'New order',
    description: 'POS menu & cart',
    icon: Store,
  },
  {
    to: '/categories',
    label: 'Categories',
    description: 'Menu groupings',
    icon: FolderTree,
  },
  {
    to: '/products',
    label: 'Products',
    description: 'Catalog & variants',
    icon: Package,
  },
  {
    to: '/shifts/session',
    label: 'Shift Session',
    description: 'Open, close, cash ledger',
    icon: Wallet,
  },
  {
    to: '/cash-registers',
    label: 'Cash registers',
    description: 'Drawers & terminals',
    icon: Landmark,
  },
]
