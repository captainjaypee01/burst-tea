import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope } from '@/types/api'
import type { OrderPayment } from '@/types/models'

export type PostPaymentPayload = {
  order_id: number
  method: 'cash' | 'e_wallet' | 'credit'
  amount_cents: number
  shift_id?: number | null
  reference?: string | null
  e_wallet_provider?: 'maya' | 'gcash' | null
}

export async function postPayment(payload: PostPaymentPayload): Promise<OrderPayment> {
  const { data } = await apiClient.post<ApiEnvelope<OrderPayment>>('/payments', payload)
  return data.data
}
