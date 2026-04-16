import { useCallback, useEffect, useState } from 'react'
import { CATALOG_UPDATED_EVENT } from '../services/config'
import { fetchPublicProducts } from '../services/catalogService'

export function useCatalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const list = await fetchPublicProducts()
      setProducts(list)
    } catch (e) {
      setError(e?.message || 'Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    const onUpdate = () => {
      load()
    }
    window.addEventListener(CATALOG_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(CATALOG_UPDATED_EVENT, onUpdate)
  }, [load])

  return { products, loading, error, refresh: load }
}
