import { normalizeGoksProduct } from './goksNormalize.js'

export function createGoksClient({ apiUrl = '', slug, storefrontKey = '', devProxy = false }) {
  if (!slug) throw new Error('createGoksClient: slug is required')

  const base = (path) =>
    `${devProxy ? '' : apiUrl}/api/public/${encodeURIComponent(slug)}${path}`

  const headers = (customerToken) => {
    const h = { Accept: 'application/json' }
    if (storefrontKey) h['X-Storefront-Key'] = storefrontKey
    if (customerToken) h['Authorization'] = `Bearer ${customerToken}`
    return h
  }

  async function apiFetch(path, opts = {}) {
    const isJson = opts.body !== undefined
    const res = await fetch(base(path), {
      method: opts.method || 'GET',
      headers: {
        ...headers(opts.token),
        ...(isJson ? { 'Content-Type': 'application/json' } : {}),
        ...opts.headers,
      },
      body: isJson ? JSON.stringify(opts.body) : undefined,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || `Goks API ${res.status}: ${path}`)
    }
    return res.json()
  }

  async function categoryMap() {
    const cats = await apiFetch('/categories')
    return Object.fromEntries((cats || []).map((c) => [c.id, c.name]))
  }

  async function fetchStore() {
    return apiFetch('')
  }

  async function fetchCategories() {
    return apiFetch('/categories')
  }

  async function fetchFeatured() {
    const [items, map] = await Promise.all([apiFetch('/featured'), categoryMap()])
    return (Array.isArray(items) ? items : []).map((p) => normalizeGoksProduct(p, map))
  }

  async function fetchProducts(params = {}) {
    const qs = new URLSearchParams()
    if (params.q) qs.set('q', params.q)
    if (params.category_id) qs.set('category_id', params.category_id)
    if (params.item_type) qs.set('item_type', params.item_type)
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.offset) qs.set('offset', String(params.offset))
    const query = qs.toString()
    const [items, map] = await Promise.all([
      apiFetch(`/products${query ? `?${query}` : ''}`),
      categoryMap(),
    ])
    return (Array.isArray(items) ? items : []).map((p) => normalizeGoksProduct(p, map))
  }

  async function fetchProduct(id) {
    const [item, map] = await Promise.all([apiFetch(`/products/${id}`), categoryMap()])
    return normalizeGoksProduct(item, map)
  }

  async function requestOTP(contact, contactType) {
    return apiFetch('/auth/request-otp', {
      method: 'POST',
      body: { contact, contact_type: contactType },
    })
  }

  async function verifyOTP(contact, contactType, code) {
    return apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: { contact, contact_type: contactType, code },
    })
  }

  async function getMe(token) {
    return apiFetch('/auth/me', { token })
  }

  async function patchMe(token, data) {
    return apiFetch('/auth/me', { method: 'PATCH', token, body: data })
  }

  return {
    fetchStore,
    fetchCategories,
    fetchFeatured,
    fetchProducts,
    fetchProduct,
    requestOTP,
    verifyOTP,
    getMe,
    patchMe,
  }
}
