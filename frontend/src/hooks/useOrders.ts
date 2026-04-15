import { useCallback, useEffect, useState } from 'react'

import { fetchOrdersPage } from '@/api/orders'
import { getApiErrorMessage } from '@/lib/api-client'
import type { PaginatedLinks, PaginatedMeta } from '@/types/api'
import type { Order } from '@/types/models'

export function useOrders(perPage = 15): {
  page: number
  setPage: (page: number) => void
  data: Order[]
  meta: PaginatedMeta | null
  links: PaginatedLinks | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
} {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Order[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | null>(null)
  const [links, setLinks] = useState<PaginatedLinks | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchOrdersPage(page, perPage)
      setData(res.data)
      setMeta(res.meta)
      setLinks(res.links)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, perPage])

  useEffect(() => {
    void load()
  }, [load])

  return { page, setPage, data, meta, links, loading, error, reload: load }
}
