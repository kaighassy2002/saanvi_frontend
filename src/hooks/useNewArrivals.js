import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATALOG_UPDATED_EVENT } from '../services/config'
import { fetchPublicProducts } from '../services/catalogService'
import { getLocalNewArrivalIds } from '../services/localCatalog'
import { USE_LOCAL_API } from '../services/config'
import { apiRequest } from '../services/apiClient'

async function fetchNewArrivalIds() {
  if (USE_LOCAL_API) return getLocalNewArrivalIds()
  try {
    const data = await apiRequest('/api/merchandising/new-arrivals', { auth: false })
    return Array.isArray(data) ? data : data.ids || []
  } catch {
    return []
  }
}

export function useNewArrivals() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [all, ids] = await Promise.all([fetchPublicProducts(), fetchNewArrivalIds()])
      const picked = ids
        .map((i) => all.find((p) => String(p.id) === String(i)))
        .filter(Boolean)
      if (picked.length === 0) {
        setProducts(all.slice(0, 6))
      } else {
        setProducts(picked)
      }
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const h = () => load()
    window.addEventListener(CATALOG_UPDATED_EVENT, h)
    return () => window.removeEventListener(CATALOG_UPDATED_EVENT, h)
  }, [load])

  const withDiscount = useMemo(
    () =>
      products.map((p) => {
        const off =
          p.originalPrice > 0
            ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
            : 0
        return { ...p, discount: off }
      }),
    [products]
  )

  return { products: withDiscount, loading, refresh: load }
}
