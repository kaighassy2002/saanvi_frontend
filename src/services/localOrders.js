import {
  ORDERS_UPDATED_EVENT,
  STOREFRONT_ORDERS_UPDATED_EVENT,
  STORAGE_KEYS,
} from './config'
import { getCustomerStorageScope, scopedStorefrontOrdersKey } from './customerStorageScope'

const ORDERS_STORAGE_VERSION = '4'

function ensureOrdersMigrated() {
  const versionKey = `${STORAGE_KEYS.orders}_version`
  if (localStorage.getItem(versionKey) === ORDERS_STORAGE_VERSION) return
  localStorage.removeItem(STORAGE_KEYS.orders)
  localStorage.setItem(versionKey, ORDERS_STORAGE_VERSION)
}

function emitOrdersUpdated() {
  window.dispatchEvent(new Event(ORDERS_UPDATED_EVENT))
}

function emitStorefrontOrdersUpdated() {
  window.dispatchEvent(new Event(STOREFRONT_ORDERS_UPDATED_EVENT))
}

function readStorefrontOrders(scope) {
  try {
    const s = localStorage.getItem(scopedStorefrontOrdersKey(scope))
    if (!s) return []
    const p = JSON.parse(s)
    return Array.isArray(p) ? p : []
  } catch {
    return []
  }
}

function writeStorefrontOrders(scope, orders) {
  localStorage.setItem(scopedStorefrontOrdersKey(scope), JSON.stringify(orders))
}

function generateLocalOrderId(existingOrders) {
  const now = new Date()
  const ymd = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  const prefix = `ORD-${ymd}-`
  const count = existingOrders.filter((o) => String(o.id || '').startsWith(prefix)).length
  return `${prefix}${1001 + count}`
}

function buildPlacementHistory(paymentMethod) {
  const at = new Date().toISOString()
  const cod = String(paymentMethod || 'cod').toLowerCase() === 'cod'
  const history = [{ status: 'Placed', paymentStatus: 'pending', note: 'Order placed', at, by: 'system' }]
  if (cod) {
    history.push({
      status: 'Placed',
      paymentStatus: 'pending',
      note: 'Cash on delivery — awaiting confirmation',
      at,
      by: 'system',
    })
  }
  return history
}

/** Orders placed on /checkout for the current customer (or shared guest bucket). */
export function getStorefrontOrdersForCurrentUser() {
  return readStorefrontOrders(getCustomerStorageScope())
}

export function getLocalOrderById(orderId) {
  const scope = getCustomerStorageScope()
  return readStorefrontOrders(scope).find((o) => o.id === orderId) || null
}

/** Whether the signed-in customer bought this product (non-cancelled storefront order). */
export function localCustomerPurchasedProduct(productId) {
  const pid = String(productId)
  const orders = getStorefrontOrdersForCurrentUser().filter((o) => o.status !== 'Cancelled')
  return orders.some((order) =>
    (order.items || []).some((item) => String(item.productId) === pid)
  )
}

function readOrders() {
  ensureOrdersMigrated()
  try {
    const s = localStorage.getItem(STORAGE_KEYS.orders)
    if (!s) return []
    const parsed = JSON.parse(s)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeOrders(orders) {
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders))
  emitOrdersUpdated()
}

export const ORDER_STATUSES = [
  'Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
  'Cancelled',
  'Return Requested',
  'Returned',
]

export function getLocalOrders() {
  return readOrders()
}

export function updateLocalOrder(orderId, patch) {
  const orders = readOrders()
  const idx = orders.findIndex((o) => o.id === orderId)
  if (idx < 0) return null
  const next = { ...orders[idx], ...patch }
  const updated = [...orders]
  updated[idx] = next
  writeOrders(updated)

  const scope = getCustomerStorageScope()
  const storefront = readStorefrontOrders(scope)
  const sIdx = storefront.findIndex((o) => o.id === orderId)
  if (sIdx >= 0) {
    const nextStorefront = [...storefront]
    nextStorefront[sIdx] = { ...nextStorefront[sIdx], ...patch }
    writeStorefrontOrders(scope, nextStorefront)
    emitStorefrontOrdersUpdated()
  }
  return next
}

function patchScopedOrder(orderId, patch) {
  const scope = getCustomerStorageScope()
  const storefront = readStorefrontOrders(scope)
  const idx = storefront.findIndex((o) => o.id === orderId)
  if (idx < 0) return null
  const next = { ...storefront[idx], ...patch }
  const updated = [...storefront]
  updated[idx] = next
  writeStorefrontOrders(scope, updated)
  emitStorefrontOrdersUpdated()
  updateLocalOrder(orderId, patch)
  return next
}

export function requestLocalOrderCancel(orderId, note = 'Customer requested cancellation') {
  const order = getLocalOrderById(orderId)
  if (!order) throw new Error('Order not found')
  if (!['Placed', 'Confirmed', 'Packed'].includes(order.status)) {
    throw new Error('Cancellation is only available before your order is shipped')
  }
  const at = new Date().toISOString()
  const history = [...(order.statusHistory || []), {
    status: order.status,
    paymentStatus: order.paymentStatus || 'pending',
    note,
    at,
    by: order.customerEmail || 'customer',
  }]
  return patchScopedOrder(orderId, { cancellationRequestedAt: at, statusHistory: history })
}

export function requestLocalOrderReturn(orderId, note = 'Customer requested return') {
  const order = getLocalOrderById(orderId)
  if (!order) throw new Error('Order not found')
  if (order.status !== 'Delivered') throw new Error('Returns are only available for delivered orders')
  const at = new Date().toISOString()
  const history = [...(order.statusHistory || []), {
    status: 'Return Requested',
    paymentStatus: order.paymentStatus || 'pending',
    note,
    at,
    by: order.customerEmail || 'customer',
  }]
  return patchScopedOrder(orderId, {
    status: 'Return Requested',
    returnRequestedAt: at,
    returnReason: note,
    statusHistory: history,
  })
}

/**
 * Create order from storefront checkout (prepended so newest first; admin sees it too).
 */
export function appendCheckoutOrder(payload) {
  const scope = getCustomerStorageScope()
  const storefrontExisting = readStorefrontOrders(scope)
  const adminOrders = readOrders()
  const id = generateLocalOrderId([...storefrontExisting, ...adminOrders])
  const placedAt = new Date().toISOString()
  const date = placedAt.slice(0, 10)
  const { shipping, paymentMethod, items, total } = payload
  const cod = String(paymentMethod || 'cod').toLowerCase() === 'cod'
  const order = {
    id,
    date,
    placedAt,
    status: cod ? 'Placed' : 'Confirmed',
    paymentStatus: cod ? 'pending' : 'paid',
    total,
    customerEmail: shipping.email,
    customerName: `${shipping.firstName} ${shipping.lastName}`.trim(),
    shipping,
    paymentMethod: cod ? 'cod' : 'razorpay',
    trackingNumber: '',
    internalNotes: '',
    placedVia: 'storefront',
    cancellationRequestedAt: null,
    returnRequestedAt: null,
    statusHistory: buildPlacementHistory(paymentMethod),
    items: items.map((i) => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      image: i.image,
    })),
  }
  if (!cod) {
    order.statusHistory.push({
      status: 'Placed',
      paymentStatus: 'paid',
      note: 'Payment successful',
      at: placedAt,
      by: 'system',
    })
    order.statusHistory.push({
      status: 'Confirmed',
      paymentStatus: 'paid',
      note: 'Order confirmed',
      at: placedAt,
      by: 'system',
    })
  }
  writeStorefrontOrders(scope, [order, ...storefrontExisting])
  writeOrders([order, ...adminOrders])
  emitStorefrontOrdersUpdated()
  return order
}
