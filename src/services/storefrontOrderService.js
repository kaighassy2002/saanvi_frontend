import { STORAGE_KEYS, USE_LOCAL_API } from './config'
import { appendCheckoutOrder, getStorefrontOrdersForCurrentUser } from './localOrders'
import { fetchBackendMyOrders, placeBackendOrder } from './jewelleryApi'

export async function placeStorefrontOrder(payload) {
  const token = localStorage.getItem(STORAGE_KEYS.customerToken)
  if (!token) throw new Error('Please sign in to place an order.')
  if (USE_LOCAL_API) return appendCheckoutOrder(payload)
  return placeBackendOrder(payload)
}

export async function fetchMyOrders() {
  if (USE_LOCAL_API) return getStorefrontOrdersForCurrentUser()
  const token = localStorage.getItem(STORAGE_KEYS.customerToken)
  if (!token) return []
  return fetchBackendMyOrders()
}
