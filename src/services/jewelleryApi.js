import { API_BASE, STORAGE_KEYS } from './config'
import { reportApiError } from '../monitoring/sentry'

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    /** @deprecated use status */
    this.statusCode = status
    this.data = data
    this.errors = data?.errors
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

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    reportApiError(error, { path, method })
    throw error
  }

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
    const apiError = new ApiError(String(msg), res.status, typeof data === 'object' ? data : null)
    reportApiError(apiError, { path, method, status: res.status })
    throw apiError
  }

  if (res.status === 204) return null
  return data
}

// --- Public catalog ---

export async function fetchStoreSettings() {
  return jewelleryFetch('/api/store-settings')
}

export async function fetchBackendCategories() {
  const data = await jewelleryFetch('/api/categories')
  return Array.isArray(data?.categories) ? data.categories : []
}

export async function fetchPublicCatalogCategories() {
  const data = await jewelleryFetch('/api/catalog/categories')
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

/** New arrivals: configured ids (server-resolved), else six newest published products. */
export async function fetchBackendNewArrivalProducts() {
  const data = await jewelleryFetch('/api/merchandising/new-arrivals/products')
  return Array.isArray(data?.products) ? data.products : []
}

// --- Customer auth ---

export async function customerRegister(body) {
  return jewelleryFetch('/api/auth/register', { method: 'POST', body, auth: false })
}

export async function customerLogin(body) {
  return jewelleryFetch('/api/auth/login', { method: 'POST', body, auth: false })
}

export async function customerGoogleLogin(body) {
  return jewelleryFetch('/api/auth/google', { method: 'POST', body, auth: false })
}

export async function customerGetMe() {
  return jewelleryFetch('/api/auth/me', { auth: 'customer' })
}

export async function customerPatchMe(body) {
  return jewelleryFetch('/api/auth/me', { method: 'PATCH', body, auth: 'customer' })
}

export async function customerGetCart() {
  const data = await jewelleryFetch('/api/auth/cart', { auth: 'customer' })
  return Array.isArray(data?.items) ? data.items : []
}

export async function customerPutCart(items) {
  const data = await jewelleryFetch('/api/auth/cart', { method: 'PUT', body: { items }, auth: 'customer' })
  return Array.isArray(data?.items) ? data.items : []
}

export async function customerGetWishlist() {
  const data = await jewelleryFetch('/api/auth/wishlist', { auth: 'customer' })
  return Array.isArray(data?.items) ? data.items : []
}

export async function customerPutWishlist(items) {
  const data = await jewelleryFetch('/api/auth/wishlist', {
    method: 'PUT',
    body: { items },
    auth: 'customer',
  })
  return Array.isArray(data?.items) ? data.items : []
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

export async function quoteCheckoutOrder(payload) {
  return jewelleryFetch('/api/orders/quote', { method: 'POST', body: payload, auth: 'customer' })
}

export async function placeBackendOrder(payload) {
  return jewelleryFetch('/api/orders', { method: 'POST', body: payload, auth: 'customer' })
}

export async function fetchRazorpayConfig() {
  try {
    return await jewelleryFetch('/api/payments/razorpay-config')
  } catch {
    return { enabled: false, keyId: null, currency: 'INR' }
  }
}

export async function createRazorpayOrder(payload) {
  return jewelleryFetch('/api/orders/razorpay-order', { method: 'POST', body: payload, auth: 'customer' })
}

export async function verifyRazorpayPayment(payload) {
  return jewelleryFetch('/api/orders/razorpay-verify', { method: 'POST', body: payload, auth: 'customer' })
}

export async function quoteCoupon(payload) {
  return jewelleryFetch('/api/coupons/quote', { method: 'POST', body: payload, auth: 'customer' })
}

export async function fetchBackendMyOrders() {
  const data = await jewelleryFetch('/api/auth/orders', { auth: 'customer' })
  return Array.isArray(data?.orders) ? data.orders : []
}

export async function fetchBackendOrderById(orderId) {
  return jewelleryFetch(`/api/auth/orders/${encodeURIComponent(orderId)}`, { auth: 'customer' })
}

export async function requestOrderCancellation(orderId, note = '') {
  return jewelleryFetch(`/api/auth/orders/${encodeURIComponent(orderId)}/cancel-request`, {
    method: 'POST',
    body: { note },
    auth: 'customer',
  })
}

export async function requestOrderReturn(orderId, note = '') {
  return jewelleryFetch(`/api/auth/orders/${encodeURIComponent(orderId)}/return-request`, {
    method: 'POST',
    body: { note },
    auth: 'customer',
  })
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
