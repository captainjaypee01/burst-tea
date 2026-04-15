import { apiClient } from '@/lib/api-client'
import type { PaginatedResponse } from '@/types/api'
import type { Product } from '@/types/models'

export async function fetchProductsPage(page: number, perPage = 15): Promise<PaginatedResponse<Product>> {
  const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', {
    params: { page, per_page: perPage },
  })
  return data
}
