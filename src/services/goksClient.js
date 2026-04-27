/**
 * Goks Public API client for customer-facing storefronts.
 *
 * PLUGGABLE: Configure via .env —
 *   VITE_API_URL=https://your-goks-backend.com
 *   VITE_STORE_SLUG=your-tenant-slug
 *
 * This is the only file that knows about the Goks API shape.
 * All other code uses the normalized local product schema.
 */
import { API_BASE, STORE_SLUG } from './config'

const base = (path) => `${API_BASE}/api/public/${STORE_SLUG}${path}`

async function goksFetch(path) {
  const res = await fetch(base(path), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Goks API ${res.status}: ${path}`)
  return res.json()
}

function normalizeGoksProduct(item, categoryMap = {}) {
  const categoryName = categoryMap[item.category_id] || 'Other'
  const price =
    item.item_type === 'sale'
      ? item.sale_price || 0
      : item.rental_rate_daily || item.rental_rate_hourly || 0

  return {
    id: item.id,
    name: item.name,
    category: categoryName,
    price,
    originalPrice: price,
    image: item.image_urls?.[0]?.thumb || item.image_urls?.[0]?.url || '',
    images: (item.image_urls || []).map((e) => e.url),
    description: item.description || '',
    stock:
      item.item_type === 'sale'
        ? (item.stock_count ?? 0)
        : (item.available_unit_count ?? 0),
    published: item.status !== 'disposed',
    item_type: item.item_type,
    rental_rate_daily: item.rental_rate_daily,
    rental_rate_hourly: item.rental_rate_hourly,
    rental_rate_weekly: item.rental_rate_weekly,
    rental_rate_monthly: item.rental_rate_monthly,
    deposit_amount: item.deposit_amount,
    billing_type: item.billing_type,
  }
}

export async function fetchGoksStore() {
  return goksFetch('')
}

export async function fetchGoksCategories() {
  return goksFetch('/categories')
}

export async function fetchGoksProducts(params = {}) {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', params.q)
  if (params.category_id) qs.set('category_id', params.category_id)
  if (params.item_type) qs.set('item_type', params.item_type)
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.offset) qs.set('offset', String(params.offset))

  const query = qs.toString()
  const cats = await fetchGoksCategories()
  const categoryMap = Object.fromEntries(cats.map((c) => [c.id, c.name]))
  const items = await goksFetch(`/products${query ? `?${query}` : ''}`)
  return (Array.isArray(items) ? items : []).map((p) => normalizeGoksProduct(p, categoryMap))
}

export async function fetchGoksProduct(id) {
  const [item, cats] = await Promise.all([
    goksFetch(`/products/${id}`),
    fetchGoksCategories(),
  ])
  const categoryMap = Object.fromEntries(cats.map((c) => [c.id, c.name]))
  return normalizeGoksProduct(item, categoryMap)
}
