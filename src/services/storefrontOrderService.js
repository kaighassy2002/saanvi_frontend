import { STORAGE_KEYS, USE_LOCAL_API } from './config'
import {
  appendCheckoutOrder,
  getLocalOrderById,
  getStorefrontOrdersForCurrentUser,
  requestLocalOrderCancel,
  requestLocalOrderReturn,
} from './localOrders'
import {
  fetchBackendMyOrders,
  fetchBackendOrderById,
  placeBackendOrder,
  requestOrderCancellation,
  requestOrderReturn,
} from './jewelleryApi'

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

export async function fetchMyOrderById(orderId) {
  if (USE_LOCAL_API) return getLocalOrderById(orderId)
  return fetchBackendOrderById(orderId)
}

export async function cancelMyOrder(orderId, note = '') {
  if (USE_LOCAL_API) return requestLocalOrderCancel(orderId, note)
  return requestOrderCancellation(orderId, note)
}

export async function returnMyOrder(orderId, note = '') {
  if (USE_LOCAL_API) return requestLocalOrderReturn(orderId, note)
  return requestOrderReturn(orderId, note)
}
