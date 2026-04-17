import { useCallback, useEffect, useState } from 'react'

import { fetchOrder } from '@/api/orders'
import { getApiErrorMessage } from '@/lib/api-client'
import type { Order } from '@/types/models'

export function useOrder(
  orderId: number | undefined,
  options: { enabled?: boolean } = {},
): {
  order: Order | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
} {
  const { enabled = true } = options
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!enabled || orderId === undefined || !Number.isFinite(orderId)) {
      setOrder(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const row = await fetchOrder(orderId)
      setOrder(row)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [orderId, enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  return { order, loading, error, reload }
}
