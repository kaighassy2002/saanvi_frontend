import {
  ORDERS_UPDATED_EVENT,
  STOREFRONT_ORDERS_UPDATED_EVENT,
  STORAGE_KEYS,
} from './config'
import { getCustomerStorageScope, scopedStorefrontOrdersKey } from './customerStorageScope'

const seedOrders = [
  {
    id: 'ORD-001',
    date: '2024-01-15',
    status: 'Delivered',
    total: 49999,
    customerEmail: 'riya@example.com',
    customerName: 'Riya Sharma',
    shipping: {
      firstName: 'Riya',
      lastName: 'Sharma',
      email: 'riya@example.com',
      phone: '9876543210',
      address: '12 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
    },
    paymentMethod: 'card',
    trackingNumber: '',
    internalNotes: '',
    items: [
      {
        productId: 1,
        name: 'Elegant Gold Necklace',
        quantity: 1,
        price: 49999,
        image: 'https://via.placeholder.com/100x100',
      },
    ],
  },
  {
    id: 'ORD-002',
    date: '2024-01-10',
    status: 'In Transit',
    total: 29998,
    customerEmail: 'arjun@example.com',
    customerName: 'Arjun Mehta',
    shipping: {
      firstName: 'Arjun',
      lastName: 'Mehta',
      email: 'arjun@example.com',
      phone: '9123456780',
      address: '45 Park Street',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700016',
    },
    paymentMethod: 'upi',
    trackingNumber: 'TRACK-77821',
    internalNotes: '',
    items: [
      {
        productId: 2,
        name: 'Silver Earrings',
        quantity: 2,
        price: 14999,
        image: 'https://via.placeholder.com/100x100',
      },
    ],
  },
  {
    id: 'ORD-003',
    date: '2024-01-05',
    status: 'Processing',
    total: 89999,
    customerEmail: 'priya@example.com',
    customerName: 'Priya Nair',
    shipping: {
      firstName: 'Priya',
      lastName: 'Nair',
      email: 'priya@example.com',
      phone: '9988776655',
      address: '8 Marine Drive',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400002',
    },
    paymentMethod: 'card',
    trackingNumber: '',
    internalNotes: 'Verify hallmarked certificate before dispatch',
    items: [
      {
        productId: 3,
        name: 'Diamond Ring',
        quantity: 1,
        price: 89999,
        image: 'https://via.placeholder.com/100x100',
      },
    ],
  },
]

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
  try {
    const s = localStorage.getItem(STORAGE_KEYS.orders)
    if (!s) {
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(seedOrders))
      return [...seedOrders]
    }
    return JSON.parse(s)
  } catch {
    return [...seedOrders]
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
