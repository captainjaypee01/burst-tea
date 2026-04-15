import { apiClient } from '@/lib/api-client'
import type { AuthUser } from '@/types/models'

type LoginResponse = {
  data: {
    token: string
    token_type: string
  }
}

type MeResponse = {
  data: AuthUser
}

export async function login(email: string, password: string): Promise<string> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password })
  return data.data.token
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<MeResponse>('/auth/me')
  return data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}
