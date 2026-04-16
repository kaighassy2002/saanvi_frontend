import { USE_LOCAL_API } from './config'
import { apiRequest } from './apiClient'
import {
  getLocalProductsAll,
  getPublicProductsLocal,
  getProductByIdLocal,
  upsertProductLocal,
  deleteProductLocal,
  getLocalCategories,
  setLocalCategories,
  getLocalNewArrivalIds,
  setLocalNewArrivalIds,
  normalizeProduct,
} from './localCatalog'

/** Tab labels for collections page: "All" + merged categories */
export async function fetchPublicCategoryTabs(products) {
  if (USE_LOCAL_API) {
    return categoriesForListing(getLocalCategories(), products)
  }
  try {
    const data = await apiRequest('/api/categories', { auth: false })
    const admin = Array.isArray(data) ? data : data.categories || []
    return categoriesForListing(admin, products)
  } catch {
    return categoriesForListing([], products)
  }
}

/** Public storefront — published products only (local) or GET /api/products */
export async function fetchPublicProducts() {
  if (USE_LOCAL_API) return getPublicProductsLocal()
  const data = await apiRequest('/api/products', { auth: false })
  return Array.isArray(data) ? data.map(normalizeProduct) : data.products?.map(normalizeProduct) || []
}

/** Single product for product detail page */
export async function fetchPublicProductById(id) {
  if (USE_LOCAL_API) {
    const p = getProductByIdLocal(id)
    if (!p || p.published === false) return null
    return p
  }
  const data = await apiRequest(`/api/products/${id}`, { auth: false })
  return data ? normalizeProduct(data) : null
}

export async function adminFetchProducts() {
  if (USE_LOCAL_API) return getLocalProductsAll()
  const data = await apiRequest('/api/admin/products')
  return Array.isArray(data) ? data.map(normalizeProduct) : data.products?.map(normalizeProduct) || []
}

export async function adminSaveProduct(product) {
  if (USE_LOCAL_API) return upsertProductLocal(product)
  const id = product.id
  if (id != null && id !== '') {
    const data = await apiRequest(`/api/admin/products/${id}`, { method: 'PATCH', body: product })
    return normalizeProduct(data)
  }
  const data = await apiRequest('/api/admin/products', { method: 'POST', body: product })
  return normalizeProduct(data)
}

export async function adminDeleteProduct(id) {
  if (USE_LOCAL_API) {
    deleteProductLocal(id)
    return
  }
  await apiRequest(`/api/admin/products/${id}`, { method: 'DELETE' })
}

export async function adminFetchCategories() {
  if (USE_LOCAL_API) return getLocalCategories()
  const data = await apiRequest('/api/admin/categories')
  return Array.isArray(data) ? data : data.categories || []
}

export async function adminSaveCategories(categories) {
  if (USE_LOCAL_API) {
    setLocalCategories(categories)
    return
  }
  await apiRequest('/api/admin/categories', { method: 'PUT', body: { categories } })
}

export async function adminFetchNewArrivalIds() {
  if (USE_LOCAL_API) return getLocalNewArrivalIds()
  const data = await apiRequest('/api/admin/merchandising/new-arrivals')
  return Array.isArray(data) ? data : data.ids || []
}

export async function adminSaveNewArrivalIds(ids) {
  if (USE_LOCAL_API) {
    setLocalNewArrivalIds(ids)
    return
  }
  await apiRequest('/api/admin/merchandising/new-arrivals', { method: 'PUT', body: { ids } })
}

/** Categories shown on storefront: "All" + admin list, merged with product categories */
export function categoriesForListing(adminCategories, products) {
  const fromProducts = [...new Set(products.map((p) => p.category).filter(Boolean))]
  const merged = [...new Set([...adminCategories, ...fromProducts])].sort((a, b) =>
    a.localeCompare(b)
  )
  return ['All', ...merged]
}
