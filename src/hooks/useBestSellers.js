import { useCallback, useEffect, useState } from 'react'
import { CATALOG_UPDATED_EVENT } from '../services/config'
import { fetchBestSellers } from '../services/productDiscoveryApi'

export function useBestSellers(limit = 10) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const items = await fetchBestSellers(limit)
      setProducts(items)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onUpdate = () => load()
    window.addEventListener(CATALOG_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(CATALOG_UPDATED_EVENT, onUpdate)
  }, [load])

  return { products, loading, refresh: load }
}
