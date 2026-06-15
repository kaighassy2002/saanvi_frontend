import { useEffect, useState } from 'react'
import { fetchRelatedProducts } from '../services/productDiscoveryApi'

export function useRelatedProducts(productId, limit = 4) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!productId) {
      setProducts([])
      return undefined
    }
    let cancelled = false
    setLoading(true)
    fetchRelatedProducts(productId, limit)
      .then((items) => {
        if (!cancelled) setProducts(items)
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [productId, limit])

  return { products, loading }
}
