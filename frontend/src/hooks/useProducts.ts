import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

import { fetchProductsPage } from '@/api/products'
import { getApiErrorMessage } from '@/lib/api-client'
import type { PaginatedLinks, PaginatedMeta } from '@/types/api'
import type { Product } from '@/types/models'

export type UseProductsOptions = {
  /** When set, only products in this category are returned. */
  categoryId?: number
  /** When false, no list request runs (e.g. invalid route id). Default true. */
  enabled?: boolean
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
  const { categoryId, enabled = true } = options
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

  return { page, setPage, data, meta, links, loading, error, reload: load }
}
