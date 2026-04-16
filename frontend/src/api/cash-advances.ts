import { apiClient } from '@/lib/api-client'
import type { CashAdvance } from '@/types/models'

type CashAdvanceResponse = {
  data: CashAdvance
}

export async function createCashAdvance(payload: {
  user_id: number
  shift_id: number
  amount_cents: number
  description?: string | null
}): Promise<CashAdvance> {
  const { data } = await apiClient.post<CashAdvanceResponse>('/cash-advances', payload)
  return data.data
}
