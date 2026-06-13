import { useContext } from 'react'
import { CatalogContext } from '../context/catalogContext'

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider')
  return ctx
}
