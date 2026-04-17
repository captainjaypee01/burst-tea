import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope } from '@/types/api'
import type { PaginatedResponse } from '@/types/api'
import type { Order } from '@/types/models'

export async function fetchOrdersPage(page: number, perPage = 15): Promise<PaginatedResponse<Order>> {
  const { data } = await apiClient.get<PaginatedResponse<Order>>('/orders', {
    params: { page, per_page: perPage },
  })
  return data
}

export type OrderLineInput = {
  product_variant_id: number
  quantity: number
  notes?: string | null
}

export type CreateOrderPayload = {
  customer_id?: number | null
  items: OrderLineInput[]
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await apiClient.post<ApiEnvelope<Order>>('/orders', payload)
  return data.data
}

export async function fetchOrder(id: number): Promise<Order> {
  const { data } = await apiClient.get<ApiEnvelope<Order>>(`/orders/${id}`)
  return data.data
}

export async function addOrderItem(
  orderId: number,
  payload: { product_variant_id: number; quantity: number; notes?: string | null },
): Promise<Order> {
  const { data } = await apiClient.post<ApiEnvelope<Order>>(`/orders/${orderId}/items`, payload)
  return data.data
}

export async function updateOrderItem(
  orderId: number,
  itemId: number,
  payload: { quantity: number; notes?: string | null },
): Promise<Order> {
  const { data } = await apiClient.patch<ApiEnvelope<Order>>(`/orders/${orderId}/items/${itemId}`, payload)
  return data.data
}

export async function deleteOrderItem(orderId: number, itemId: number): Promise<Order> {
  const { data } = await apiClient.delete<ApiEnvelope<Order>>(`/orders/${orderId}/items/${itemId}`)
  return data.data
}

export async function cancelOrder(orderId: number): Promise<Order> {
  const { data } = await apiClient.post<ApiEnvelope<Order>>(`/orders/${orderId}/cancel`)
  return data.data
}
