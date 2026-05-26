import { useCallback, useEffect, useMemo, useState } from 'react'

import { CATALOG_UPDATED_EVENT, USE_LOCAL_API } from '../services/config'

import { fetchBackendNewArrivalProducts } from '../services/jewelleryApi'

import { getPublicProductsLocal } from '../services/localCatalog'



export function useNewArrivals() {

  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(true)



  const load = useCallback(async () => {

    setLoading(true)

    try {

      let items

      if (USE_LOCAL_API) {

        const all = await getPublicProductsLocal()

        items = all.slice(0, 6)

      } else {

        items = await fetchBackendNewArrivalProducts()

      }

      setProducts(items)

    } catch {

      setProducts([])

    } finally {

      setLoading(false)

    }

  }, [])



  useEffect(() => {

    load()

  }, [load])



  useEffect(() => {

    const h = () => load()

    window.addEventListener(CATALOG_UPDATED_EVENT, h)

    return () => window.removeEventListener(CATALOG_UPDATED_EVENT, h)

  }, [load])



  const withDiscount = useMemo(

    () =>

      products.map((p) => {

        const off =

          p.originalPrice > 0

            ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)

            : 0

        return { ...p, discount: off }

      }),

    [products]

  )



  return { products: withDiscount, loading, refresh: load }

}

