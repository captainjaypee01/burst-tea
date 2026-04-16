import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/components/auth/RequireAuth'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { CashRegisterLedgerHistoryPage } from '@/pages/CashRegisterLedgerHistoryPage'
import { CashRegistersPage } from '@/pages/CashRegistersPage'
import { ShiftsSessionPage } from '@/pages/ShiftsSessionPage'

export default function App(): ReactElement {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/shifts/session" element={<ShiftsSessionPage />} />
          <Route path="/cash-registers/:cashRegisterId/ledger-history" element={<CashRegisterLedgerHistoryPage />} />
          <Route path="/cash-registers" element={<CashRegistersPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
