import { useCallback, useEffect, useState } from 'react'
import { CATALOG_UPDATED_EVENT } from '../services/config'
import { fetchPublicProductById } from '../services/catalogService'

export function useProduct(id) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (id == null || id === '') {
      setProduct(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const p = await fetchPublicProductById(id)
      setProduct(p)
    } catch (e) {
      setError(e?.message || 'Failed to load product')
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onUpdate = () => load()
    window.addEventListener(CATALOG_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(CATALOG_UPDATED_EVENT, onUpdate)
  }, [load])

  return { product, loading, error, refresh: load }
}
