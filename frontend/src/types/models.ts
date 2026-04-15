export type AccountKind = 'staff' | 'customer' | 'member'

export type AuthUser = {
  id: number
  name: string
  email: string | null
  account_kind: AccountKind
  is_active: boolean
  is_superadmin: boolean
  roles?: string[]
  permissions?: string[]
}

export type ProductVariant = {
  id: number
  product_id: number
  name: string
  price_cents: number
  sku: string | null
  is_active: boolean
}

export type Product = {
  id: number
  category_id: number | null
  name: string
  description: string | null
  is_active: boolean
  variants?: ProductVariant[]
}

export type Order = {
  id: number
  order_number: string
  user_id: number
  customer_id: number | null
  status: string
  payment_status: string
  subtotal_cents: number
  tax_cents: number
  total_cents: number
  amount_paid_cents: number
  is_credit: boolean
}

export type Customer = {
  id: number
  name: string
  phone: string | null
  outstanding_balance_cents: number
}
