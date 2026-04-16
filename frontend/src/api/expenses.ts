import { apiClient } from '@/lib/api-client'
import type { Expense } from '@/types/models'

type ExpenseResponse = {
  data: Expense
}

export async function createExpense(payload: {
  shift_id: number
  description: string
  amount_cents: number
  category?: string | null
}): Promise<Expense> {
  const { data } = await apiClient.post<ExpenseResponse>('/expenses', payload)
  return data.data
}
