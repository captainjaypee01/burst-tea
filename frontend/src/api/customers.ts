import { apiClient } from '@/lib/api-client'
import type { PaginatedResponse } from '@/types/api'
import type { Customer } from '@/types/models'

export async function fetchCustomersPage(page: number, perPage = 15): Promise<PaginatedResponse<Customer>> {
  const { data } = await apiClient.get<PaginatedResponse<Customer>>('/customers', {
    params: { page, per_page: perPage },
  })
  return data
}
