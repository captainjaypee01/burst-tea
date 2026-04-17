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

export type Category = {
  id: number
  name: string
  slug: string | null
  sort_order: number
  is_active: boolean
}

export type ProductVariant = {
  id: number
  product_id: number
  name: string
  price_cents: number
  sku: string | null
  is_active: boolean
  /** Present when the API loads `variant.product` (e.g. order line items). */
  product?: Product
}

export type Product = {
  id: number
  category_id: number | null
  name: string
  description: string | null
  is_active: boolean
  category?: Category | null
  variants?: ProductVariant[]
}

export type OrderItem = {
  id: number
  product_variant_id: number
  quantity: number
  unit_price_cents: number
  line_total_cents: number
  notes: string | null
  variant?: ProductVariant & { product?: Product }
}

export type OrderPayment = {
  id: number
  order_id: number
  user_id: number | null
  shift_id: number | null
  method: string
  amount_cents: number
  reference: string | null
  e_wallet_provider: string | null
  created_at?: string | null
  shift?: Shift & { cash_register?: CashRegister }
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
  items?: OrderItem[]
  payments?: OrderPayment[]
  created_at?: string | null
  updated_at?: string | null
}

export type Customer = {
  id: number
  name: string
  phone: string | null
  outstanding_balance_cents: number
}

export type CashRegister = {
  id: number
  name: string
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type Shift = {
  id: number
  user_id: number
  closed_by_user_id: number | null
  cash_register_id: number
  status: string
  name: string | null
  opened_at: string | null
  closed_at: string | null
  opening_cash_cents: number
  closing_cash_cents: number | null
  user?: AuthUser
  closed_by?: AuthUser
  cash_register?: CashRegister
}

export type CashLedgerEntry = {
  id: number
  shift_id: number
  type: string
  amount_cents: number
  reference_type: string | null
  reference_id: number | null
  notes: string | null
  created_at: string | null
}

export type Expense = {
  id: number
  user_id: number | null
  shift_id: number | null
  category: string | null
  description: string
  amount_cents: number
  created_at?: string | null
}

export type CashAdvance = {
  id: number
  user_id: number
  shift_id: number | null
  amount_cents: number
  description: string | null
  repaid_at?: string | null
  created_at?: string | null
}
