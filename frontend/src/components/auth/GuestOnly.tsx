import type { ReactElement } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/stores/authStore'

/**
 * **Public** shell: only for routes that must not require a session (e.g. `/login`).
 * If a bearer token exists, redirect to the dashboard so staff never see the login screen while authenticated.
 */
export function GuestOnly(): ReactElement {
  const token = useAuthStore((s) => s.token)

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
