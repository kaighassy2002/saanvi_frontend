import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATALOG_UPDATED_EVENT, USE_LOCAL_API } from '../services/config'
import { fetchBackendNewArrivalProducts } from '../services/jewelleryApi'
import { useCatalog } from './useCatalog'

function withDiscount(products) {
  return products.map((p) => {
    const off =
      p.originalPrice > 0
        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
        : 0
    return { ...p, discount: off }
  })
}

export function useNewArrivals() {
  const { products: catalogProducts, loading: catalogLoading } = useCatalog()
  const [fetchedProducts, setFetchedProducts] = useState([])
  const [loading, setLoading] = useState(!USE_LOCAL_API)

  const load = useCallback(async () => {
    if (USE_LOCAL_API) return
    setLoading(true)
    try {
      const items = await fetchBackendNewArrivalProducts()
      setFetchedProducts(items)
    } catch {
      setFetchedProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (USE_LOCAL_API) return undefined
    const onUpdate = () => load()
    window.addEventListener(CATALOG_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(CATALOG_UPDATED_EVENT, onUpdate)
  }, [load])

  const sourceProducts = useMemo(
    () => (USE_LOCAL_API ? catalogProducts.slice(0, 6) : fetchedProducts),
    [catalogProducts, fetchedProducts]
  )

  const products = useMemo(() => withDiscount(sourceProducts), [sourceProducts])

  const isLoading = USE_LOCAL_API ? catalogLoading && products.length === 0 : loading

  return { products, loading: isLoading, refresh: load }
}
