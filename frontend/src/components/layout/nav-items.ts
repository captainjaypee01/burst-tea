import { LayoutDashboard, Package, ShoppingCart } from 'lucide-react'
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
    to: '/products',
    label: 'Products',
    description: 'Catalog & variants',
    icon: Package,
  },
]
