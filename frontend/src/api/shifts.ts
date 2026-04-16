import { apiClient } from '@/lib/api-client'
import type { PaginatedResponse } from '@/types/api'
import type { CashLedgerEntry, Shift } from '@/types/models'

type ShiftResponse = {
  data: Shift | null
}

export async function fetchCurrentShift(cashRegisterId: number): Promise<Shift | null> {
  const { data } = await apiClient.get<ShiftResponse>('/shifts/current', {
    params: { cash_register_id: cashRegisterId },
  })
  return data.data
}

export async function openShift(cashRegisterId: number, openingCashCents: number): Promise<Shift> {
  const { data } = await apiClient.post<ShiftResponse>('/shifts/open', {
    cash_register_id: cashRegisterId,
    opening_cash_cents: openingCashCents,
  })
  if (!data.data) {
    throw new Error('Shift open response is empty')
  }
  return data.data
}

export async function closeShift(shiftId: number, closingCashCents: number): Promise<Shift> {
  const { data } = await apiClient.post<ShiftResponse>(`/shifts/${shiftId}/close`, {
    closing_cash_cents: closingCashCents,
  })
  if (!data.data) {
    throw new Error('Shift close response is empty')
  }
  return data.data
}

export async function recordShiftCashAdjustment(
  shiftId: number,
  deltaCents: number,
  reason: string,
): Promise<void> {
  await apiClient.post(`/shifts/${shiftId}/cash-adjustment`, {
    delta_cents: deltaCents,
    reason,
  })
}

export async function fetchShiftCashLedger(
  shiftId: number,
  page: number,
  perPage = 15,
): Promise<PaginatedResponse<CashLedgerEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<CashLedgerEntry>>(`/shifts/${shiftId}/cash-ledger`, {
    params: { page, per_page: perPage },
  })

  return data
}

export async function fetchShiftsForCashRegister(
  cashRegisterId: number,
  page: number,
  perPage = 15,
): Promise<PaginatedResponse<Shift>> {
  const { data } = await apiClient.get<PaginatedResponse<Shift>>(
    `/cash-registers/${cashRegisterId}/shifts`,
    { params: { page, per_page: perPage } },
  )

  return data
}
