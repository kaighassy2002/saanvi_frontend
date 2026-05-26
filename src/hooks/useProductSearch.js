import { useMemo } from 'react'
import { productMatchesSearch } from '../services/listingSearchParams'

const MAX_PRODUCTS = 6
const MAX_CATEGORIES = 4

/**
 * @param {Array} products
 * @param {string} query
 */
export function useProductSearch(products, query) {
  return useMemo(() => {
    const q = String(query || '').trim().toLowerCase()
    if (!q || !products?.length) {
      return { products: [], categories: [] }
    }

    const matchedProducts = []
    const categorySet = new Set()

    for (const product of products) {
      if (!productMatchesSearch(product, q)) continue
      if (product.category) categorySet.add(product.category)
      if (matchedProducts.length < MAX_PRODUCTS) {
        matchedProducts.push(product)
      }
    }

    const categories = [...categorySet]
      .filter((name) => name.toLowerCase().includes(q) || q.length >= 2)
      .slice(0, MAX_CATEGORIES)
      .map((name) => ({ name, href: `/collections?category=${encodeURIComponent(name)}` }))

    const extraCategories = [...categorySet]
      .filter((c) => !categories.some((x) => x.name === c))
      .slice(0, MAX_CATEGORIES - categories.length)
      .map((name) => ({ name, href: `/collections?category=${encodeURIComponent(name)}` }))

    return {
      products: matchedProducts,
      categories: [...categories, ...extraCategories].slice(0, MAX_CATEGORIES),
    }
  }, [products, query])
}
