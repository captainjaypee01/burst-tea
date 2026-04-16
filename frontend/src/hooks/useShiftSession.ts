import { useCallback, useEffect, useState } from 'react'

import * as shiftsApi from '@/api/shifts'
import { getApiErrorMessage } from '@/lib/api-client'
import type { Shift } from '@/types/models'

export function useShiftSession(cashRegisterId: number | null): {
  shift: Shift | null
  loading: boolean
  error: string | null
  open: (openingCashCents: number) => Promise<void>
  close: (closingCashCents: number) => Promise<void>
  recordAdjustment: (deltaCents: number, reason?: string) => Promise<void>
  reload: () => Promise<void>
} {
  const [shift, setShift] = useState<Shift | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (cashRegisterId === null) {
      setShift(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const currentShift = await shiftsApi.fetchCurrentShift(cashRegisterId)
      setShift(currentShift)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [cashRegisterId])

  const open = useCallback(
    async (openingCashCents: number) => {
      if (cashRegisterId === null) {
        return
      }
      setLoading(true)
      setError(null)
      try {
        const openedShift = await shiftsApi.openShift(cashRegisterId, openingCashCents)
        setShift(openedShift)
      } catch (err) {
        setError(getApiErrorMessage(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [cashRegisterId],
  )

  const close = useCallback(
    async (closingCashCents: number) => {
      if (!shift) {
        return
      }
      setLoading(true)
      setError(null)
      try {
        const closedShift = await shiftsApi.closeShift(shift.id, closingCashCents)
        setShift(closedShift)
      } catch (err) {
        setError(getApiErrorMessage(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [shift],
  )

  const recordAdjustment = useCallback(
    async (deltaCents: number, reason: string) => {
      if (!shift) {
        return
      }
      setLoading(true)
      setError(null)
      try {
        await shiftsApi.recordShiftCashAdjustment(shift.id, deltaCents, reason)
        await load()
      } catch (err) {
        setError(getApiErrorMessage(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [shift, load],
  )

  useEffect(() => {
    void load()
  }, [load])

  return { shift, loading, error, open, close, recordAdjustment, reload: load }
}
