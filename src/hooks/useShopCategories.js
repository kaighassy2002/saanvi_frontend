import { useCallback, useEffect, useState } from 'react'
import { USE_LOCAL_API } from '../services/config'
import { fetchBackendCategories } from '../services/jewelleryApi'
import { getLocalCategories } from '../services/localCatalog'
import { mergeCategoriesWithImages } from '../services/shopCategories'

export function useShopCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      let names = []
      if (USE_LOCAL_API) {
        names = getLocalCategories()
      } else {
        names = await fetchBackendCategories()
      }
      setCategories(mergeCategoriesWithImages(names))
    } catch (e) {
      setError(e?.message || 'Could not load categories')
      setCategories(mergeCategoriesWithImages([]))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { categories, loading, error, reload: load }
}
