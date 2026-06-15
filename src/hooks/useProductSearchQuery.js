import { useEffect, useState } from 'react'
import { searchProducts } from '../services/productDiscoveryApi'

/**
 * Debounced server-side product search for header autocomplete.
 * @param {string} query
 * @param {{ enabled?: boolean, limit?: number }} [options]
 */
export function useProductSearchQuery(query, { enabled = true, limit = 6 } = {}) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = String(query || '').trim()
    if (!enabled || !q) {
      setProducts([])
      setCategories([])
      setLoading(false)
      return undefined
    }

    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      searchProducts(q, limit)
        .then((data) => {
          if (cancelled) return
          setProducts(Array.isArray(data?.products) ? data.products : [])
          setCategories(Array.isArray(data?.categories) ? data.categories : [])
        })
        .catch(() => {
          if (cancelled) return
          setProducts([])
          setCategories([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, enabled, limit])

  return { products, categories, loading }
}
