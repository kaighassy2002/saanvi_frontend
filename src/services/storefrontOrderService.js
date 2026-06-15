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
import { getOrderPublicId } from './orderWorkflow'

function normalizeOrderRow(order) {
  if (!order || typeof order !== 'object') return null
  const id = getOrderPublicId(order)
  if (!id) return null
  return { ...order, id }
}

export async function placeStorefrontOrder(payload) {
  const token = localStorage.getItem(STORAGE_KEYS.customerToken)
  if (!token) throw new Error('Please sign in to place an order.')
  if (USE_LOCAL_API) return appendCheckoutOrder(payload)
  return placeBackendOrder(payload)
}

export async function fetchMyOrders() {
  const rows = USE_LOCAL_API
    ? getStorefrontOrdersForCurrentUser()
    : await (async () => {
        const token = localStorage.getItem(STORAGE_KEYS.customerToken)
        if (!token) return []
        return fetchBackendMyOrders()
      })()
  return rows.map(normalizeOrderRow).filter(Boolean)
}

export async function fetchMyOrderById(orderId) {
  const id = String(orderId || '').trim()
  if (!id) return null
  const row = USE_LOCAL_API ? getLocalOrderById(id) : await fetchBackendOrderById(id)
  return normalizeOrderRow(row)
}

export async function cancelMyOrder(orderId, note = '') {
  if (USE_LOCAL_API) return requestLocalOrderCancel(orderId, note)
  return requestOrderCancellation(orderId, note)
}

export async function returnMyOrder(orderId, note = '') {
  if (USE_LOCAL_API) return requestLocalOrderReturn(orderId, note)
  return requestOrderReturn(orderId, note)
}
