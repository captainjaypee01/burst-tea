import { apiClient } from '@/lib/api-client'
import type { PaginatedResponse } from '@/types/api'
import type { Order } from '@/types/models'

export async function fetchOrdersPage(page: number, perPage = 15): Promise<PaginatedResponse<Order>> {
  const { data } = await apiClient.get<PaginatedResponse<Order>>('/orders', {
    params: { page, per_page: perPage },
  })
  return data
}
