import { useCallback, useEffect, useState } from 'react'

import { fetchProduct } from '@/api/products'
import { getApiErrorMessage } from '@/lib/api-client'
import type { Product } from '@/types/models'

export function useProduct(productId: number | undefined): {
  product: Product | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
} {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (productId == null || Number.isNaN(productId)) {
      setProduct(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetchProduct(productId)
      setProduct(res)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void load()
  }, [load])

  return { product, loading, error, reload: load }
}
