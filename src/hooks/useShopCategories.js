import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStoreSettings } from '../context/storeSettingsContext'
import { USE_LOCAL_API } from '../services/config'
import {
  fetchBackendCategories,
  fetchPublicCatalogCategories,
} from '../services/jewelleryApi'
import { getLocalCategories } from '../services/localCatalog'
import {
  applyHomeCategoryImageOverrides,
  mergeCategoriesWithImages,
} from '../services/shopCategories'

export function useShopCategories() {
  const { homeCategoryImages } = useStoreSettings()
  const [rawCategories, setRawCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const categories = useMemo(
    () => applyHomeCategoryImageOverrides(rawCategories, homeCategoryImages),
    [rawCategories, homeCategoryImages]
  )

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      if (USE_LOCAL_API) {
        const names = getLocalCategories()
        setRawCategories(mergeCategoriesWithImages(names))
        return
      }

      const [catalogCategories, legacyNames] = await Promise.all([
        fetchPublicCatalogCategories().catch(() => []),
        fetchBackendCategories().catch(() => []),
      ])
      setRawCategories(mergeCategoriesWithImages(legacyNames, catalogCategories))
    } catch (e) {
      setError(e?.message || 'Could not load categories')
      setRawCategories(mergeCategoriesWithImages([]))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { categories, loading, error, reload: load }
}
