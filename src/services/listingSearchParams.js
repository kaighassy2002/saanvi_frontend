export const SORT_VALUES = ['featured', 'latest', 'discount', 'price-low', 'price-high', 'name']
export const STOCK_VALUES = ['all', 'in-stock', 'out-stock']

export function productMatchesSearch(product, term) {
  const t = String(term || '').trim().toLowerCase()
  if (!t) return true
  const name = String(product.name || '').toLowerCase()
  const category = String(product.category || '').toLowerCase()
  const description = String(product.description || '').toLowerCase()
  return name.includes(t) || category.includes(t) || description.includes(t)
}

export function clampPriceRange(min, max, bounds) {
  const bMin = Number(bounds.min) || 0
  const bMax = Number(bounds.max) || 0
  if (bMax <= bMin) return { min: bMin, max: bMax }
  let lo = Number.isFinite(min) ? min : bMin
  let hi = Number.isFinite(max) ? max : bMax
  lo = Math.max(bMin, Math.min(lo, bMax))
  hi = Math.max(bMin, Math.min(hi, bMax))
  if (lo > hi) [lo, hi] = [hi, lo]
  return { min: lo, max: hi }
}

function parseCommaParam(searchParams, key) {
  const raw = searchParams.get(key)
  if (!raw) return []
  return [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))]
}

export function parseListingState(searchParams, bounds) {
  const sortRaw = searchParams.get('sort')
  const sortBy = SORT_VALUES.includes(sortRaw) ? sortRaw : 'featured'

  const stockRaw = searchParams.get('stock')
  const availability = STOCK_VALUES.includes(stockRaw) ? stockRaw : 'all'

  const minRaw = searchParams.get('min')
  const maxRaw = searchParams.get('max')
  const minNum = minRaw != null && minRaw !== '' ? Number(minRaw) : bounds.min
  const maxNum = maxRaw != null && maxRaw !== '' ? Number(maxRaw) : bounds.max

  return {
    sortBy,
    availability,
    priceRange: clampPriceRange(minNum, maxNum, bounds),
    selectedColors: parseCommaParam(searchParams, 'color'),
    selectedMaterials: parseCommaParam(searchParams, 'material'),
  }
}

/**
 * Merge listing filters into URLSearchParams.
 * Pass `null` for a field to remove it; omit keys to leave unchanged.
 */
export function buildListingSearchParams(patch, currentParams) {
  const next = new URLSearchParams(currentParams?.toString() || '')

  if ('category' in patch) {
    const c = patch.category
    if (c && c !== 'All') next.set('category', c)
    else next.delete('category')
  }
  if ('search' in patch) {
    const s = String(patch.search || '').trim()
    if (s) next.set('search', s)
    else next.delete('search')
  }
  if ('sort' in patch) {
    const s = patch.sort
    if (s && s !== 'featured') next.set('sort', s)
    else next.delete('sort')
  }
  if ('stock' in patch) {
    const s = patch.stock
    if (s && s !== 'all') next.set('stock', s)
    else next.delete('stock')
  }
  if ('priceRange' in patch) {
    const { min, max } = patch.priceRange
    const bMin = patch.boundsMin ?? min
    const bMax = patch.boundsMax ?? max
    if (min !== bMin || max !== bMax) {
      next.set('min', String(min))
      next.set('max', String(max))
    } else {
      next.delete('min')
      next.delete('max')
    }
  }
  if ('colors' in patch) {
    const list = Array.isArray(patch.colors) ? patch.colors.filter(Boolean) : []
    if (list.length) next.set('color', list.join(','))
    else next.delete('color')
  }
  if ('materials' in patch) {
    const list = Array.isArray(patch.materials) ? patch.materials.filter(Boolean) : []
    if (list.length) next.set('material', list.join(','))
    else next.delete('material')
  }

  return next
}

export function listingParamsToHref(params) {
  const q = params.toString()
  return q ? `/collections?${q}` : '/collections'
}
