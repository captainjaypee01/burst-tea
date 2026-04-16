import { apiClient } from '@/lib/api-client'
import type { PaginatedResponse } from '@/types/api'
import type { CashRegister } from '@/types/models'

type CashRegisterOptionsResponse = {
  data: Pick<CashRegister, 'id' | 'name'>[]
}

type CashRegisterResponse = {
  data: CashRegister
}

export async function fetchCashRegisterOptions(): Promise<Pick<CashRegister, 'id' | 'name'>[]> {
  const { data } = await apiClient.get<CashRegisterOptionsResponse>('/cash-registers/options')
  return data.data
}

export async function fetchCashRegistersPage(page: number, perPage = 15): Promise<PaginatedResponse<CashRegister>> {
  const { data } = await apiClient.get<PaginatedResponse<CashRegister>>('/cash-registers', {
    params: { page, per_page: perPage },
  })
  return data
}

export async function fetchCashRegister(id: number): Promise<CashRegister> {
  const { data } = await apiClient.get<CashRegisterResponse>(`/cash-registers/${id}`)
  return data.data
}

export async function createCashRegister(name: string): Promise<CashRegister> {
  const { data } = await apiClient.post<CashRegisterResponse>('/cash-registers', { name })
  return data.data
}

export async function updateCashRegister(
  id: number,
  payload: { name?: string; is_active?: boolean },
): Promise<CashRegister> {
  const { data } = await apiClient.put<CashRegisterResponse>(`/cash-registers/${id}`, payload)
  return data.data
}

export async function deactivateCashRegister(id: number): Promise<void> {
  await apiClient.delete(`/cash-registers/${id}`)
}
