import { useCallback, useEffect, useState } from 'react'

import { fetchCategory } from '@/api/categories'
import { getApiErrorMessage } from '@/lib/api-client'
import type { Category } from '@/types/models'

export type UseCategoryOptions = {
  /** When false, no request runs (e.g. missing permission or invalid route). Default true. */
  enabled?: boolean
}

export function useCategory(
  id: number | undefined,
  options: UseCategoryOptions = {},
): {
  category: Category | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
} {
  const { enabled = true } = options
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!enabled || id === undefined || !Number.isFinite(id)) {
      setCategory(null)
      setError(null)
      setLoading(false)

      return
    }

    setLoading(true)
    setError(null)
    try {
      const row = await fetchCategory(id)
      setCategory(row)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setCategory(null)
    } finally {
      setLoading(false)
    }
  }, [id, enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  return { category, loading, error, reload }
}
