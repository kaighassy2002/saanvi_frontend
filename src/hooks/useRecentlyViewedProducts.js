import { useEffect, useState } from 'react'
import { fetchPublicProductById } from '../services/catalogService'
import { getRecentlyViewedIds } from '../services/recentlyViewed'

export function useRecentlyViewedProducts(excludeProductId, limit = 4) {
  const [products, setProducts] = useState([])

  useEffect(() => {
    const ids = getRecentlyViewedIds()
      .filter((id) => String(id) !== String(excludeProductId))
      .slice(0, limit)
    if (!ids.length) {
      setProducts([])
      return undefined
    }
    let cancelled = false
    Promise.all(ids.map((id) => fetchPublicProductById(id).catch(() => null)))
      .then((results) => {
        if (!cancelled) setProducts(results.filter(Boolean))
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
    return () => {
      cancelled = true
    }
  }, [excludeProductId, limit])

  return products
}
