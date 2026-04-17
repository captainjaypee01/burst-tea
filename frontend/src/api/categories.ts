import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope } from '@/types/api'
import type { PaginatedResponse } from '@/types/api'
import type { Category } from '@/types/models'

export type CategoryOptionRow = { id: number; name: string }

export async function fetchCategoriesPage(page: number, perPage = 15): Promise<PaginatedResponse<Category>> {
  const { data } = await apiClient.get<PaginatedResponse<Category>>('/categories', {
    params: { page, per_page: perPage },
  })
  return data
}

export async function fetchCategoryOptions(): Promise<CategoryOptionRow[]> {
  const { data } = await apiClient.get<{ data: CategoryOptionRow[] }>('/categories/options')
  return data.data
}

export async function fetchCategory(id: number): Promise<Category> {
  const { data } = await apiClient.get<ApiEnvelope<Category>>(`/categories/${id}`)
  return data.data
}

export type CategoryPayload = {
  name: string
  slug?: string | null
  sort_order?: number
  is_active?: boolean
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const { data } = await apiClient.post<ApiEnvelope<Category>>('/categories', payload)
  return data.data
}

export async function updateCategory(id: number, payload: Partial<CategoryPayload>): Promise<Category> {
  const { data } = await apiClient.put<ApiEnvelope<Category>>(`/categories/${id}`, payload)
  return data.data
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/categories/${id}`)
}
