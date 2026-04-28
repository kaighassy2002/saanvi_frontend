/**
 * Order placement and retrieval.
 *
 * Orders are not yet implemented in the Goks public API.
 * When they are, replace the localStorage path with:
 *   POST /api/public/{slug}/orders   (requires customer JWT)
 *   GET  /api/public/{slug}/orders   (requires customer JWT)
 *
 * Until then, orders are stored locally (USE_LOCAL_API behaviour).
 */
import { STORAGE_KEYS, USE_LOCAL_API } from './config'
import { appendCheckoutOrder, getStorefrontOrdersForCurrentUser } from './localOrders'

export async function placeStorefrontOrder(payload) {
  const token = localStorage.getItem(STORAGE_KEYS.customerToken)
  if (!token) throw new Error('Please sign in to place an order.')
  if (USE_LOCAL_API) return appendCheckoutOrder(payload)
  // TODO: POST /api/public/${STORE_SLUG}/orders with Bearer token when Goks orders API ships
  return appendCheckoutOrder(payload)
}

export async function fetchMyOrders() {
  if (USE_LOCAL_API) return getStorefrontOrdersForCurrentUser()
  const token = localStorage.getItem(STORAGE_KEYS.customerToken)
  if (!token) return []
  // TODO: GET /api/public/${STORE_SLUG}/orders with Bearer token when Goks orders API ships
  return getStorefrontOrdersForCurrentUser()
}
