import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATALOG_UPDATED_EVENT } from '../services/config'
import { fetchPublicProducts } from '../services/catalogService'
import { CatalogContext } from './catalogContext'

/** Loads full catalog from localStorage — only used in offline demo mode (USE_LOCAL_API). */
export default function LocalCatalogProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const loadPromiseRef = useRef(null)

  const load = useCallback(async () => {
    if (loadPromiseRef.current) return loadPromiseRef.current

    const promise = (async () => {
      setError(null)
      try {
        const list = await fetchPublicProducts()
        setProducts(list)
      } catch (e) {
        setError(e?.message || 'Failed to load products')
        setProducts([])
      } finally {
        setLoading(false)
        loadPromiseRef.current = null
      }
    })()

    loadPromiseRef.current = promise
    return promise
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    await load()
  }, [load])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    const onUpdate = () => {
      refresh()
    }
    window.addEventListener(CATALOG_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(CATALOG_UPDATED_EVENT, onUpdate)
  }, [refresh])

  const value = useMemo(
    () => ({
      products,
      loading,
      error,
      refresh,
    }),
    [products, loading, error, refresh]
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}
