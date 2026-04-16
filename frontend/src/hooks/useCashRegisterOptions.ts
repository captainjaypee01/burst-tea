import { useCallback, useEffect, useState } from 'react'

import { fetchCashRegisterOptions } from '@/api/cash-registers'
import { getApiErrorMessage } from '@/lib/api-client'
import type { CashRegister } from '@/types/models'

export function useCashRegisterOptions(enabled: boolean): {
  options: Pick<CashRegister, 'id' | 'name'>[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
} {
  const [options, setOptions] = useState<Pick<CashRegister, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!enabled) {
      setOptions([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchCashRegisterOptions()
      setOptions(rows)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void load()
  }, [load])

  return { options, loading, error, reload: load }
}
