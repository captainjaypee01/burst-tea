import { useCallback } from 'react'

import * as authApi from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import type { AuthUser } from '@/types/models'

export function useAuth(): {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
} {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const setSession = useAuthStore((s) => s.setSession)
  const setToken = useAuthStore((s) => s.setToken)
  const clearSession = useAuthStore((s) => s.clearSession)

  const login = useCallback(
    async (email: string, password: string) => {
      const newToken = await authApi.login(email, password)
      // Must store token before fetchMe — api-client interceptor reads it for Authorization: Bearer …
      setToken(newToken)
      const me = await authApi.fetchMe()
      setSession(newToken, me)
    },
    [setSession, setToken],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  return {
    token,
    user,
    isAuthenticated: Boolean(token),
    login,
    logout,
  }
}
