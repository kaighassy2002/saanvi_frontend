import { expandProductsForCollectionListing, productIsInStock } from './productVariants'

function compareNames(a, b) {
  return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { sensitivity: 'base' })
}

/** Newest-first timestamp from API fields or MongoDB ObjectId. */
export function getProductRecencyMs(product) {
  for (const field of ['createdAt', 'updatedAt']) {
    const raw = product?.[field]
    if (!raw) continue
    const t = new Date(raw).getTime()
    if (Number.isFinite(t)) return t
  }

  const id = String(product?.id || '')
  if (/^[a-f0-9]{24}$/i.test(id)) {
    return parseInt(id.slice(0, 8), 16) * 1000
  }

  const numeric = Number(id)
  return Number.isFinite(numeric) ? numeric : 0
}

export function getDiscountRatio(product) {
  const price = Number(product?.price) || 0
  const original = Number(product?.originalPrice) || 0
  if (original > price && original > 0) return (original - price) / original
  return 0
}

function compareInStock(a, b, inStockFn) {
  const sa = inStockFn(a) ? 0 : 1
  const sb = inStockFn(b) ? 0 : 1
  return sa - sb
}

function compareListingEntries(a, b) {
  const nameCmp = compareNames(a.displayProduct, b.displayProduct)
  if (nameCmp !== 0) return nameCmp
  return String(a.colorLabel || '').localeCompare(String(b.colorLabel || ''), undefined, {
    sensitivity: 'base',
  })
}

/**
 * Sort parent catalog products (before variant expansion).
 */
export function sortProductsForCollection(
  products,
  sortBy,
  { featuredProductIds = [], inStockFn = productIsInStock } = {}
) {
  const copy = [...products]

  if (sortBy === 'name') {
    return copy.sort(compareNames)
  }

  if (sortBy === 'latest') {
    return copy.sort((a, b) => {
      const diff = getProductRecencyMs(b) - getProductRecencyMs(a)
      if (diff !== 0) return diff
      return compareNames(a, b)
    })
  }

  if (sortBy === 'discount') {
    return copy.sort((a, b) => {
      const diff = getDiscountRatio(b) - getDiscountRatio(a)
      if (diff !== 0) return diff
      const recency = getProductRecencyMs(b) - getProductRecencyMs(a)
      if (recency !== 0) return recency
      return compareNames(a, b)
    })
  }

  if (sortBy === 'price-low' || sortBy === 'price-high') {
    return copy
  }

  const featuredRank = new Map(
    (featuredProductIds || []).map(String).filter(Boolean).map((id, index) => [id, index])
  )

  return copy.sort((a, b) => {
    const ra = featuredRank.has(String(a.id)) ? featuredRank.get(String(a.id)) : Number.MAX_SAFE_INTEGER
    const rb = featuredRank.has(String(b.id)) ? featuredRank.get(String(b.id)) : Number.MAX_SAFE_INTEGER
    if (ra !== rb) return ra - rb

    const fa = a.featured ? 0 : 1
    const fb = b.featured ? 0 : 1
    if (fa !== fb) return fa - fb

    const stockCmp = compareInStock(a, b, inStockFn)
    if (stockCmp !== 0) return stockCmp

    const recency = getProductRecencyMs(b) - getProductRecencyMs(a)
    if (recency !== 0) return recency

    return compareNames(a, b)
  })
}

/** Sort expanded listing cards (per-variant price / discount). */
export function sortListingEntries(entries, sortBy) {
  if (sortBy !== 'price-low' && sortBy !== 'price-high' && sortBy !== 'discount') {
    return entries
  }

  const copy = [...entries]

  if (sortBy === 'price-low') {
    return copy.sort((a, b) => {
      const diff = (Number(a.displayProduct?.price) || 0) - (Number(b.displayProduct?.price) || 0)
      if (diff !== 0) return diff
      return compareListingEntries(a, b)
    })
  }

  if (sortBy === 'price-high') {
    return copy.sort((a, b) => {
      const diff = (Number(b.displayProduct?.price) || 0) - (Number(a.displayProduct?.price) || 0)
      if (diff !== 0) return diff
      return compareListingEntries(a, b)
    })
  }

  return copy.sort((a, b) => {
    const diff = getDiscountRatio(b.displayProduct) - getDiscountRatio(a.displayProduct)
    if (diff !== 0) return diff
    return compareListingEntries(a, b)
  })
}

const POST_EXPAND_SORTS = new Set(['price-low', 'price-high', 'discount'])

/** Stable per-day seed so the default browse order refreshes without jumping on every visit. */
export function getDailyBrowseSeed() {
  const now = new Date()
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
}

function seededShuffle(items, seed) {
  const list = [...items]
  let state = seed >>> 0

  for (let i = list.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    const j = state % (i + 1)
    ;[list[i], list[j]] = [list[j], list[i]]
  }

  return list
}

/**
 * Keep admin-pinned featured products first; lightly shuffle everything else per day.
 */
export function mixSortedProductsForBrowse(products, featuredProductIds = []) {
  const pinnedIds = new Set((featuredProductIds || []).map(String).filter(Boolean))
  if (!products.length) return []

  const pinned = []
  const rest = []

  for (const product of products) {
    if (pinnedIds.has(String(product.id))) pinned.push(product)
    else rest.push(product)
  }

  if (rest.length <= 1) return [...pinned, ...rest]
  return [...pinned, ...seededShuffle(rest, getDailyBrowseSeed())]
}

/**
 * Round-robin by parent product so colour variants are not shown in a single row cluster.
 */
export function interleaveListingEntries(entries) {
  if (entries.length <= 1) return entries

  const groups = new Map()
  const groupOrder = []

  for (const entry of entries) {
    const id = String(entry.productId)
    if (!groups.has(id)) {
      groups.set(id, [])
      groupOrder.push(id)
    }
    groups.get(id).push(entry)
  }

  if (groupOrder.length <= 1) return entries

  const mixed = []
  let remaining = entries.length

  while (remaining > 0) {
    for (const id of groupOrder) {
      const queue = groups.get(id)
      if (!queue?.length) continue
      mixed.push(queue.shift())
      remaining -= 1
    }
  }

  return mixed
}

const POST_EXPAND_MIX_SORTS = new Set(['featured', 'latest'])

/**
 * Filtered products → stable collection grid order (with variant expansion).
 */
export function buildCollectionListing(products, sortBy, options = {}) {
  if (POST_EXPAND_SORTS.has(sortBy)) {
    const entries = expandProductsForCollectionListing(products)
    return sortListingEntries(entries, sortBy)
  }

  let sorted = sortProductsForCollection(products, sortBy, options)

  if (sortBy === 'featured') {
    sorted = mixSortedProductsForBrowse(sorted, options.featuredProductIds)
  }

  let entries = expandProductsForCollectionListing(sorted)

  if (POST_EXPAND_MIX_SORTS.has(sortBy)) {
    entries = interleaveListingEntries(entries)
  }

  return entries
}
