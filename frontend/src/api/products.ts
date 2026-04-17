import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope } from '@/types/api'
import type { PaginatedResponse } from '@/types/api'
import type { Product, ProductVariant } from '@/types/models'

export type FetchProductsParams = {
  categoryId?: number
}

export async function fetchProductsPage(
  page: number,
  perPage = 15,
  params: FetchProductsParams = {},
): Promise<PaginatedResponse<Product>> {
  const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', {
    params: {
      page,
      per_page: perPage,
      ...(params.categoryId !== undefined ? { category_id: params.categoryId } : {}),
    },
  })
  return data
}

export async function fetchProduct(id: number): Promise<Product> {
  const { data } = await apiClient.get<ApiEnvelope<Product>>(`/products/${id}`)
  return data.data
}

export type VariantInput = {
  name: string
  price_cents: number
  sku?: string | null
  is_active?: boolean
}

export type CreateProductPayload = {
  category_id?: number | null
  name: string
  description?: string | null
  is_active?: boolean
  variants: VariantInput[]
}

export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const { data } = await apiClient.post<ApiEnvelope<Product>>('/products', payload)
  return data.data
}

export type UpdateProductPayload = {
  category_id?: number | null
  name?: string
  description?: string | null
  is_active?: boolean
}

export async function updateProduct(id: number, payload: UpdateProductPayload): Promise<Product> {
  const { data } = await apiClient.put<ApiEnvelope<Product>>(`/products/${id}`, payload)
  return data.data
}

export async function deleteProduct(id: number): Promise<void> {
  await apiClient.delete(`/products/${id}`)
}

export async function createVariant(productId: number, payload: VariantInput): Promise<ProductVariant> {
  const { data } = await apiClient.post<ApiEnvelope<ProductVariant>>(
    `/products/${productId}/variants`,
    payload,
  )
  return data.data
}

export async function updateVariant(
  productId: number,
  variantId: number,
  payload: Partial<VariantInput>,
): Promise<ProductVariant> {
  const { data } = await apiClient.put<ApiEnvelope<ProductVariant>>(
    `/products/${productId}/variants/${variantId}`,
    payload,
  )
  return data.data
}

export async function deleteVariant(productId: number, variantId: number): Promise<void> {
  await apiClient.delete(`/products/${productId}/variants/${variantId}`)
}
