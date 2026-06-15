import React from 'react'
import { USE_LOCAL_API } from '../services/config'
import LocalCatalogProvider from './LocalCatalogProvider'
import { CatalogContext } from './catalogContext'

const emptyCatalogValue = {
  products: [],
  loading: false,
  error: null,
  refresh: async () => {},
}

/** Live API mode uses targeted discovery endpoints; demo mode loads full local catalog. */
export default function CatalogProvider({ children }) {
  if (USE_LOCAL_API) {
    return <LocalCatalogProvider>{children}</LocalCatalogProvider>
  }
  return <CatalogContext.Provider value={emptyCatalogValue}>{children}</CatalogContext.Provider>
}
