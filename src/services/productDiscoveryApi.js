import { USE_LOCAL_API } from './config'
import { jewelleryFetch } from './jewelleryApi'
import { getPublicProductsLocal } from './localCatalog'
import { resolveFeaturedProducts } from './homeMerchandising'
import { getBestSellerProducts } from './homeProductSections'
import { getRelatedProducts } from './relatedProducts'

export async function searchProducts(query, limit = 6) {
  const q = String(query || '').trim()
  if (!q) return { products: [], categories: [] }
  if (USE_LOCAL_API) {
    const products = getPublicProductsLocal()
    const ql = q.toLowerCase()
    const matched = products
      .filter(
        (p) =>
          String(p.name || '').toLowerCase().includes(ql) ||
          String(p.category || '').toLowerCase().includes(ql)
      )
      .slice(0, limit)
    const categorySet = new Set()
    for (const p of products) {
      if (p.category && String(p.category).toLowerCase().includes(ql)) {
        categorySet.add(p.category)
      }
    }
    const categories = [...categorySet].slice(0, 4).map((name) => ({
      name,
      href: `/collections?category=${encodeURIComponent(name)}`,
    }))
    return { products: matched, categories }
  }
  const data = await jewelleryFetch(
    `/api/products/search?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(String(limit))}`
  )
  return {
    products: Array.isArray(data?.products) ? data.products : [],
    categories: Array.isArray(data?.categories) ? data.categories : [],
  }
}

export async function fetchFeaturedProducts(limit = 10) {
  if (USE_LOCAL_API) {
    const products = getPublicProductsLocal()
    return products.slice(0, limit)
  }
  const data = await jewelleryFetch(`/api/products/featured?limit=${encodeURIComponent(String(limit))}`)
  return Array.isArray(data?.products) ? data.products : []
}

export async function fetchBestSellers(limit = 10) {
  if (USE_LOCAL_API) {
    return getBestSellerProducts(getPublicProductsLocal(), limit)
  }
  const data = await jewelleryFetch(
    `/api/products/best-sellers?limit=${encodeURIComponent(String(limit))}`
  )
  return Array.isArray(data?.products) ? data.products : []
}

export async function fetchRelatedProducts(productId, limit = 4) {
  if (USE_LOCAL_API) {
    const catalog = getPublicProductsLocal()
    const current = catalog.find((p) => String(p.id) === String(productId))
    return getRelatedProducts(catalog, current || { id: productId }, limit)
  }
  const data = await jewelleryFetch(
    `/api/products/${encodeURIComponent(productId)}/related?limit=${encodeURIComponent(String(limit))}`
  )
  return Array.isArray(data?.products) ? data.products : []
}

/** Resolve featured list using admin-pinned ids when in local demo mode. */
export function resolveFeaturedFromCatalog(catalog, featuredIds, limit = 10) {
  return resolveFeaturedProducts(catalog, featuredIds, limit)
}
