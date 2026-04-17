import { useCallback, useEffect, useState } from 'react'

import { fetchCategoryOptions } from '@/api/categories'
import { getApiErrorMessage } from '@/lib/api-client'

export type CategoryOption = { id: number; name: string }

export function useCategoryOptions(enabled = true): {
  categories: CategoryOption[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
} {
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!enabled) {
      setCategories([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const rows = await fetchCategoryOptions()
      setCategories(rows)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  return { categories, loading, error, reload }
}
