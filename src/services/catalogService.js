import { USE_LOCAL_API } from './config'
import {
  getPublicProductsLocal,
  getProductByIdLocal,
  getLocalCategories,
} from './localCatalog'
import { fetchGoksCategories, fetchGoksProducts, fetchGoksProduct } from './goksClient'

/** Tab labels for collections page: "All" + merged categories */
export async function fetchPublicCategoryTabs(products) {
  if (USE_LOCAL_API) return categoriesForListing(getLocalCategories(), products)
  try {
    const cats = await fetchGoksCategories()
    return ['All', ...cats.map((c) => c.name).sort()]
  } catch {
    return categoriesForListing([], products)
  }
}

/** Public storefront — published products only */
export async function fetchPublicProducts() {
  if (USE_LOCAL_API) return getPublicProductsLocal()
  return fetchGoksProducts()
}

/** Single product for product detail page */
export async function fetchPublicProductById(id) {
  if (USE_LOCAL_API) {
    const p = getProductByIdLocal(id)
    return p?.published === false ? null : p ?? null
  }
  return fetchGoksProduct(id)
}

/** Categories shown on storefront: "All" + admin list, merged with product categories */
export function categoriesForListing(adminCategories, products) {
  const fromProducts = [...new Set(products.map((p) => p.category).filter(Boolean))]
  const merged = [...new Set([...adminCategories, ...fromProducts])].sort((a, b) =>
    a.localeCompare(b)
  )
  return ['All', ...merged]
}
