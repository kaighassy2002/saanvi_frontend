import { jewelleryFetch } from './jewelleryApi'

export const LISTING_PAGE_SIZE = 16

/**
 * @param {URLSearchParams} searchParams
 * @param {number} [page]
 * @param {number} [limit]
 */
export function buildListingQueryFromParams(searchParams, page = 1, limit = LISTING_PAGE_SIZE) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))

  const category = searchParams.get('category')
  if (category && category !== 'All') params.set('category', category)

  const search = searchParams.get('search')
  if (search?.trim()) params.set('search', search.trim())

  const sort = searchParams.get('sort')
  if (sort && sort !== 'featured') params.set('sort', sort)

  const stock = searchParams.get('stock')
  if (stock && stock !== 'all') params.set('stock', stock)

  const min = searchParams.get('min')
  if (min != null && min !== '') params.set('min', min)

  const max = searchParams.get('max')
  if (max != null && max !== '') params.set('max', max)

  const color = searchParams.get('color')
  if (color) params.set('color', color)

  const material = searchParams.get('material')
  if (material) params.set('material', material)

  return params
}

export async function fetchProductListing(searchParams, page = 1, limit = LISTING_PAGE_SIZE) {
  const qs = buildListingQueryFromParams(searchParams, page, limit)
  return jewelleryFetch(`/api/products/listing?${qs.toString()}`)
}
