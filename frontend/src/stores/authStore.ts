import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AuthUser } from '@/types/models'

type AuthState = {
  token: string | null
  user: AuthUser | null
  /** Set bearer token only (used after login, before /auth/me). */
  setToken: (token: string) => void
  setSession: (token: string, user: AuthUser) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    {
      name: 'burst-tea-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)
