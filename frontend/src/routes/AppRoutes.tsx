import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { GuestOnly } from '@/components/auth/GuestOnly'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { RouteLoadingFallback } from '@/components/layout/RouteLoadingFallback'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const OrderComposerPage = lazy(() => import('@/pages/OrderComposerPage'))
const OrderCheckoutPage = lazy(() => import('@/pages/OrderCheckoutPage'))
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage'))
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'))
const CategoryDetailPage = lazy(() => import('@/pages/CategoryDetailPage'))
const ProductsPage = lazy(() => import('@/pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'))
const ShiftsSessionPage = lazy(() => import('@/pages/ShiftsSessionPage'))
const CashRegistersPage = lazy(() => import('@/pages/CashRegistersPage'))
const CashRegisterLedgerHistoryPage = lazy(() => import('@/pages/CashRegisterLedgerHistoryPage'))

/**
 * Application route tree: **public** (guest) vs **private** (authenticated staff).
 * Each page is lazy-loaded (default export) for smaller initial bundles.
 */
export function AppRoutes(): ReactElement {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* —— Public —— */}
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* —— Private (Sanctum token required) —— */}
        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/pos/new" element={<OrderComposerPage />} />
            <Route path="/pos/:orderId/compose" element={<OrderComposerPage />} />
            <Route path="/pos/:orderId/checkout" element={<OrderCheckoutPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/:categoryId" element={<CategoryDetailPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:productId" element={<ProductDetailPage />} />
            <Route path="/shifts/session" element={<ShiftsSessionPage />} />
            <Route path="/cash-registers/:cashRegisterId/ledger-history" element={<CashRegisterLedgerHistoryPage />} />
            <Route path="/cash-registers" element={<CashRegistersPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
