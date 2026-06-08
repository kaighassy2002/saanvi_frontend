import { useMemo } from 'react'
import { useCatalog } from './useCatalog'
import { useStoreSettings } from '../context/storeSettingsContext'
import { resolveFeaturedProducts } from '../services/homeMerchandising'

export function useFeaturedProducts(limit = 10) {
  const { products, loading: catalogLoading } = useCatalog()
  const { featuredProductIds, ready: settingsReady } = useStoreSettings()

  const featured = useMemo(
    () => resolveFeaturedProducts(products, featuredProductIds, limit),
    [products, featuredProductIds, limit]
  )

  const loading = !settingsReady || (catalogLoading && featured.length === 0)

  return { products: featured, loading }
}
