/**
 * Goks Public API client for customer-facing storefronts.
 *
 * PLUGGABLE: Configure via .env —
 *   VITE_API_URL=https://your-goks-backend.com
 *   VITE_STORE_SLUG=your-tenant-slug
 *   VITE_STOREFRONT_KEY=your-storefront-access-token
 *
 * This is the only file that knows about the Goks API shape.
 * All other code uses the normalized local product schema.
 */
import { API_BASE, STORE_SLUG } from './config'

const STOREFRONT_KEY = import.meta.env.VITE_STOREFRONT_KEY || ''

const base = (path) => `${API_BASE}/api/public/${STORE_SLUG}${path}`

function storefrontHeaders(customerToken) {
  const h = { Accept: 'application/json' }
  if (STOREFRONT_KEY) h['X-Storefront-Key'] = STOREFRONT_KEY
  if (customerToken) h['Authorization'] = `Bearer ${customerToken}`
  return h
}

async function goksFetch(path, opts = {}) {
  const res = await fetch(base(path), {
    headers: storefrontHeaders(opts.token),
    method: opts.method || 'GET',
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    ...(opts.body ? { headers: { ...storefrontHeaders(opts.token), 'Content-Type': 'application/json' } } : {}),
  })
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
    availability: item.availability || 'out_of_stock',
    // Derived boolean for UI components that expect a stock number
    stock: item.availability === 'out_of_stock' ? 0 : 1,
    published: true,
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

export async function fetchGoksFeatured() {
  const cats = await fetchGoksCategories()
  const categoryMap = Object.fromEntries(cats.map((c) => [c.id, c.name]))
  const items = await goksFetch('/featured')
  return (Array.isArray(items) ? items : []).map((p) => normalizeGoksProduct(p, categoryMap))
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

// ─── Customer auth ────────────────────────────────────────────────────────────

export async function goksRequestOTP(contact, contactType) {
  const res = await fetch(base('/auth/request-otp'), {
    method: 'POST',
    headers: { ...storefrontHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact, contact_type: contactType }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Request failed (${res.status})`)
  }
  return res.json()
}

export async function goksVerifyOTP(contact, contactType, code) {
  const res = await fetch(base('/auth/verify-otp'), {
    method: 'POST',
    headers: { ...storefrontHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact, contact_type: contactType, code }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Verification failed (${res.status})`)
  }
  return res.json()
}

export async function goksGetMe(token) {
  return goksFetch('/auth/me', { token })
}

export async function goksPatchMe(token, data) {
  const res = await fetch(base('/auth/me'), {
    method: 'PATCH',
    headers: { ...storefrontHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Update failed (${res.status})`)
  }
  return res.json()
}
