import { USE_LOCAL_API } from './config'
import {
  getPublicProductsLocal,
  getProductByIdLocal,
  getLocalCategories,
} from './localCatalog'
import {
  fetchBackendCategories,
  fetchBackendProducts,
  fetchBackendProductById,
} from './jewelleryApi'

function normalizePublicProduct(product) {
  if (!product || typeof product !== 'object') return null
  const id = String(product.id || product._id || '').trim()
  if (!id) return null
  return { ...product, id }
}

/** Tab labels for collections page: "All" + merged categories */
export async function fetchPublicCategoryTabs(products) {
  if (USE_LOCAL_API) return categoriesForListing(getLocalCategories(), products)
  try {
    const cats = await fetchBackendCategories()
    return categoriesForListing(cats, products)
  } catch {
    return categoriesForListing([], products)
  }
}

/** Public storefront — published products only */
export async function fetchPublicProducts() {
  if (USE_LOCAL_API) return getPublicProductsLocal()
  return fetchBackendProducts()
}

/** Single product for product detail page */
export async function fetchPublicProductById(id) {
  if (USE_LOCAL_API) {
    const p = getProductByIdLocal(id)
    return normalizePublicProduct(p?.published === false ? null : p ?? null)
  }
  const row = await fetchBackendProductById(id)
  return normalizePublicProduct(row)
}

/** Categories shown on storefront: "All" + admin list, merged with product categories */
export function categoriesForListing(adminCategories, products) {
  const fromProducts = [...new Set(products.map((p) => p.category).filter(Boolean))]
  const merged = [...new Set([...adminCategories, ...fromProducts])].sort((a, b) =>
    a.localeCompare(b)
  )
  return ['All', ...merged]
}
