import {
  ORDERS_UPDATED_EVENT,
  STOREFRONT_ORDERS_UPDATED_EVENT,
  STORAGE_KEYS,
} from './config'
import { getCustomerStorageScope, scopedStorefrontOrdersKey } from './customerStorageScope'

const ORDERS_STORAGE_VERSION = '2'

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

/** Orders placed on /checkout for the current customer (or shared guest bucket). */
export function getStorefrontOrdersForCurrentUser() {
  return readStorefrontOrders(getCustomerStorageScope())
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

export const ORDER_STATUSES = ['Processing', 'In Transit', 'Delivered', 'Cancelled']

export function getLocalOrders() {
  return readOrders()
}

export function getLocalOrderById(orderId) {
  return readOrders().find((o) => o.id === orderId) || null
}

export function updateLocalOrder(orderId, patch) {
  const orders = readOrders()
  const idx = orders.findIndex((o) => o.id === orderId)
  if (idx < 0) return null
  const next = { ...orders[idx], ...patch }
  const updated = [...orders]
  updated[idx] = next
  writeOrders(updated)
  return next
}

/**
 * Create order from storefront checkout (prepended so newest first; admin sees it too).
 * @param {{ shipping: object, paymentMethod: string, items: { productId: number, name: string, image: string, quantity: number, price: number }[], total: number }} payload
 */
export function appendCheckoutOrder(payload) {
  const scope = getCustomerStorageScope()
  const storefrontExisting = readStorefrontOrders(scope)
  const adminOrders = readOrders()
  const id = `ORD-${Date.now()}`
  const date = new Date().toISOString().slice(0, 10)
  const { shipping, paymentMethod, items, total } = payload
  const order = {
    id,
    date,
    status: 'Processing',
    total,
    customerEmail: shipping.email,
    customerName: `${shipping.firstName} ${shipping.lastName}`.trim(),
    shipping,
    paymentMethod,
    trackingNumber: '',
    internalNotes: '',
    placedVia: 'storefront',
    items: items.map((i) => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      image: i.image,
    })),
  }
  writeStorefrontOrders(scope, [order, ...storefrontExisting])
  writeOrders([order, ...adminOrders])
  emitStorefrontOrdersUpdated()
  return order
}
