import { API_BASE, STORAGE_KEYS } from './config'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    /** @deprecated use status */
    this.statusCode = status
  }
}

/**
 * @param {string} path - e.g. /api/products
 * @param {{ method?: string, body?: object, token?: string | null, auth?: 'customer' | 'admin' | false }} options
 */
export async function jewelleryFetch(path, options = {}) {
  const { method = 'GET', body, auth = false } = options
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let token = options.token
  if (token === undefined && auth === 'customer') {
    token = localStorage.getItem(STORAGE_KEYS.customerToken)
  } else if (token === undefined && auth === 'admin') {
    token = localStorage.getItem(STORAGE_KEYS.adminToken)
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data?.message ? data.message : text || res.statusText
    throw new ApiError(String(msg), res.status)
  }

  if (res.status === 204) return null
  return data
}

// --- Public catalog ---

export async function fetchBackendCategories() {
  const data = await jewelleryFetch('/api/categories')
  return Array.isArray(data?.categories) ? data.categories : []
}

export async function fetchBackendProducts() {
  const data = await jewelleryFetch('/api/products')
  return Array.isArray(data?.products) ? data.products : []
}

export async function fetchBackendProductById(id) {
  return jewelleryFetch(`/api/products/${encodeURIComponent(id)}`)
}

export async function fetchBackendNewArrivalIds() {
  const data = await jewelleryFetch('/api/merchandising/new-arrivals')
  return Array.isArray(data?.ids) ? data.ids.map(String) : []
}

/** New arrivals: configured ids, else six newest published products. */
export async function fetchBackendNewArrivalProducts() {
  const [ids, products] = await Promise.all([
    fetchBackendNewArrivalIds(),
    fetchBackendProducts(),
  ])
  if (ids.length > 0) {
    const byId = new Map(products.map((p) => [String(p.id), p]))
    const picked = ids.map((id) => byId.get(id)).filter(Boolean)
    if (picked.length > 0) return picked.slice(0, 12)
  }
  return products.slice(0, 6)
}

// --- Customer auth ---

export async function customerRegister(body) {
  return jewelleryFetch('/api/auth/register', { method: 'POST', body, auth: false })
}

export async function customerLogin(body) {
  return jewelleryFetch('/api/auth/login', { method: 'POST', body, auth: false })
}

export async function customerGetMe() {
  return jewelleryFetch('/api/auth/me', { auth: 'customer' })
}

export async function customerPatchMe(body) {
  return jewelleryFetch('/api/auth/me', { method: 'PATCH', body, auth: 'customer' })
}

export async function customerForgotPasswordRequest(email) {
  return jewelleryFetch('/api/auth/forgot-password/request', {
    method: 'POST',
    body: { email },
    auth: false,
  })
}

export async function customerForgotPasswordVerifyOtp(email, otp) {
  return jewelleryFetch('/api/auth/forgot-password/verify', {
    method: 'POST',
    body: { email, otp },
    auth: false,
  })
}

export async function customerForgotPasswordReset(resetToken, newPassword) {
  return jewelleryFetch('/api/auth/forgot-password/reset', {
    method: 'POST',
    body: { resetToken, newPassword },
    auth: false,
  })
}

// --- Storefront orders ---

export async function placeBackendOrder(payload) {
  return jewelleryFetch('/api/orders', { method: 'POST', body: payload, auth: 'customer' })
}

export async function fetchBackendMyOrders() {
  const data = await jewelleryFetch('/api/auth/orders', { auth: 'customer' })
  return Array.isArray(data?.orders) ? data.orders : []
}

// --- Admin ---

export async function adminLoginRequest(email, password) {
  return jewelleryFetch('/api/admin/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
}

export async function adminFetch(path, options = {}) {
  return jewelleryFetch(path, { ...options, auth: 'admin' })
}
