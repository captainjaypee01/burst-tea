import { useCallback, useEffect, useState } from 'react'

import { fetchShiftsForCashRegister } from '@/api/shifts'
import { getApiErrorMessage } from '@/lib/api-client'
import type { PaginatedLinks, PaginatedMeta } from '@/types/api'
import type { Shift } from '@/types/models'

export function useCashRegisterShifts(cashRegisterId: number | null, perPage = 15): {
  page: number
  setPage: (page: number) => void
  data: Shift[]
  meta: PaginatedMeta | null
  links: PaginatedLinks | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
} {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Shift[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | null>(null)
  const [links, setLinks] = useState<PaginatedLinks | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (cashRegisterId === null) {
      setData([])
      setMeta(null)
      setLinks(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetchShiftsForCashRegister(cashRegisterId, page, perPage)
      setData(res.data)
      setMeta(res.meta)
      setLinks(res.links)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [cashRegisterId, page, perPage])

  useEffect(() => {
    setPage(1)
  }, [cashRegisterId])

  useEffect(() => {
    void load()
  }, [load])

  return { page, setPage, data, meta, links, loading, error, reload: load }
}
