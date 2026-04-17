import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'

import { fetchProductsPage } from '@/api/products'
import { getApiErrorMessage } from '@/lib/api-client'
import type { PaginatedLinks, PaginatedMeta } from '@/types/api'
import type { Product } from '@/types/models'

export type UseProductsOptions = {
  /** When set, only products in this category are returned. */
  categoryId?: number
  /** When false, no list request runs (e.g. invalid route id). Default true. */
  enabled?: boolean
  /** Client-side filter on name / description (no API `search` param yet). */
  search?: string
}

export function useProducts(perPage = 15, options: UseProductsOptions = {}): {
  page: number
  setPage: (page: number) => void
  data: Product[]
  meta: PaginatedMeta | null
  links: PaginatedLinks | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
} {
  const { categoryId, enabled = true, search = '' } = options
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Product[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | null>(null)
  const [links, setLinks] = useState<PaginatedLinks | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useLayoutEffect(() => {
    setPage(1)
  }, [categoryId])

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      setError(null)
      setData([])
      setMeta(null)
      setLinks(null)

      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetchProductsPage(page, perPage, {
        categoryId,
      })
      setData(res.data)
      setMeta(res.meta)
      setLinks(res.links)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, perPage, categoryId, enabled])

  useEffect(() => {
    void load()
  }, [load])

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) {
      return data
    }
    return data.filter((p) => {
      if (p.name.toLowerCase().includes(q)) {
        return true
      }
      return (p.description?.toLowerCase().includes(q) ?? false)
    })
  }, [data, search])

  return { page, setPage, data: filteredData, meta, links, loading, error, reload: load }
}
