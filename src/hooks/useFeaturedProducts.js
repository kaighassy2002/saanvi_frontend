import { useCallback, useEffect, useState } from 'react'
import { CATALOG_UPDATED_EVENT, USE_LOCAL_API } from '../services/config'
import { fetchFeaturedProducts, resolveFeaturedFromCatalog } from '../services/productDiscoveryApi'
import { useStoreSettings } from '../context/storeSettingsContext'
import { useCatalog } from './useCatalog'

export function useFeaturedProducts(limit = 10) {
  const { featuredProductIds, ready: settingsReady } = useStoreSettings()
  const { products: catalogProducts, loading: catalogLoading } = useCatalog()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(!USE_LOCAL_API)

  const load = useCallback(async () => {
    if (USE_LOCAL_API) return
    setLoading(true)
    try {
      const items = await fetchFeaturedProducts(limit)
      setProducts(items)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    if (USE_LOCAL_API) return undefined
    load()
    const onUpdate = () => load()
    window.addEventListener(CATALOG_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(CATALOG_UPDATED_EVENT, onUpdate)
  }, [load])

  if (USE_LOCAL_API) {
    const featured = resolveFeaturedFromCatalog(catalogProducts, featuredProductIds, limit)
    return {
      products: featured,
      loading: !settingsReady || (catalogLoading && featured.length === 0),
    }
  }

  return {
    products,
    loading: !settingsReady || (loading && products.length === 0),
    refresh: load,
  }
}
