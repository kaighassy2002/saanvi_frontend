import { API_BASE, STORAGE_KEYS, USE_LOCAL_API } from './config'
import { appendCheckoutOrder, getStorefrontOrdersForCurrentUser } from './localOrders'

/**
 * Place order: localStorage when USE_LOCAL_API; else POST /api/orders (MongoDB).
 * Requires a customer JWT (enforced here and on the server).
 */
export async function placeStorefrontOrder(payload) {
  const token = localStorage.getItem(STORAGE_KEYS.customerToken)
  if (USE_LOCAL_API) {
    if (!token) throw new Error('Please sign in to place an order.')
    return appendCheckoutOrder(payload)
  }
  if (!token) throw new Error('Please sign in to place an order.')
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
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
    const msg = typeof data === 'object' && data?.message ? data.message : text || res.statusText
    throw new Error(String(msg))
  }
  return data
}

/** My orders: scoped localStorage or GET /api/auth/orders (requires login). */
export async function fetchMyOrders() {
  if (USE_LOCAL_API) {
    return getStorefrontOrdersForCurrentUser()
  }
  const token = localStorage.getItem(STORAGE_KEYS.customerToken)
  if (!token) return []
  const res = await fetch(`${API_BASE}/api/auth/orders`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })
  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }
  if (!res.ok) {
    const msg = typeof data === 'object' && data?.message ? data.message : text || res.statusText
    throw new Error(String(msg))
  }
  const orders = Array.isArray(data) ? data : data?.orders
  return Array.isArray(orders) ? orders : []
}
