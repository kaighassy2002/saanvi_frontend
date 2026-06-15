/** Marketplace-style order lifecycle — mirrors backend orderWorkflow.js */

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

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']

/** Main customer tracking steps (Flipkart / Amazon style) */
export const ORDER_STATUS_FLOW = [
  'Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
]

export function normalizeLegacyOrderStatus(status) {
  const s = String(status || 'Placed')
  const map = {
    Pending: 'Placed',
    Processing: 'Packed',
    Paid: 'Confirmed',
    'In Transit': 'Shipped',
  }
  return map[s] || s
}

export function formatPaymentStatusLabel(status) {
  const key = String(status || 'pending').toLowerCase()
  if (key === 'paid') return 'Paid'
  if (key === 'failed') return 'Failed'
  if (key === 'refunded' || key === 'partially_refunded') return 'Refunded'
  return 'Pending'
}

export function formatPaymentMethodLabel(method) {
  const key = String(method || '').toLowerCase()
  if (key === 'razorpay' || key === 'online') return 'Online payment'
  if (key === 'cod' || key === 'cash') return 'Cash on delivery'
  if (key === 'upi') return 'UPI'
  if (key === 'card') return 'Card'
  if (!key) return '—'
  return key.charAt(0).toUpperCase() + key.slice(1)
}

export function orderStatusTone(status) {
  switch (normalizeLegacyOrderStatus(status)) {
    case 'Delivered':
      return 'delivered'
    case 'Out For Delivery':
    case 'Shipped':
      return 'transit'
    case 'Packed':
    case 'Confirmed':
      return 'processing'
    case 'Placed':
      return 'pending'
    case 'Cancelled':
      return 'cancelled'
    case 'Return Requested':
      return 'return-pending'
    case 'Returned':
      return 'returned'
    default:
      return 'default'
  }
}

export function orderStatusIcon(status) {
  switch (normalizeLegacyOrderStatus(status)) {
    case 'Delivered':
      return 'fa-solid fa-box-open'
    case 'Out For Delivery':
      return 'fa-solid fa-motorcycle'
    case 'Shipped':
      return 'fa-solid fa-truck-fast'
    case 'Packed':
      return 'fa-solid fa-box'
    case 'Confirmed':
      return 'fa-solid fa-circle-check'
    case 'Placed':
      return 'fa-solid fa-clock'
    case 'Cancelled':
      return 'fa-solid fa-circle-xmark'
    case 'Return Requested':
      return 'fa-solid fa-rotate-left'
    case 'Returned':
      return 'fa-solid fa-rotate-left'
    default:
      return 'fa-solid fa-box'
  }
}

export function orderStatusNote(status) {
  switch (normalizeLegacyOrderStatus(status)) {
    case 'Placed':
      return 'Order received — we will confirm shortly.'
    case 'Confirmed':
      return 'Order confirmed and queued for packing.'
    case 'Packed':
      return 'Your jewellery is packed and ready to ship.'
    case 'Shipped':
      return 'Handed to courier — track with the ID below.'
    case 'Out For Delivery':
      return 'Out for delivery today — please keep your phone handy.'
    case 'Delivered':
      return 'Delivered successfully. Thank you for shopping with us.'
    case 'Cancelled':
      return 'This order was cancelled.'
    case 'Return Requested':
      return 'Return request received — our team will review it.'
    case 'Returned':
      return 'Return completed. Refund status is shown under payment.'
    default:
      return null
  }
}

export function canCustomerCancel(status) {
  const s = normalizeLegacyOrderStatus(status)
  return s === 'Placed' || s === 'Confirmed' || s === 'Packed'
}

export function canCustomerReturn(status) {
  return normalizeLegacyOrderStatus(status) === 'Delivered'
}

export function flowIndex(status) {
  const s = normalizeLegacyOrderStatus(status)
  if (s === 'Cancelled' || s === 'Returned' || s === 'Return Requested') return -1
  const idx = ORDER_STATUS_FLOW.indexOf(s)
  return idx >= 0 ? idx : 0
}

/** Stable storefront/admin order key (public id). */
export function getOrderPublicId(order) {
  if (order == null) return ''
  return String(order.id || order.publicId || '').trim()
}

export function formatOrderDateTime(raw) {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw)
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function timelineLabel(entry) {
  const note = entry?.note
  const status = entry?.status
  if (typeof note === 'string' && note.trim()) return note.trim()
  if (typeof status === 'string' && status.trim()) return status.trim()
  return 'Update'
}

export function buildCustomerTimeline(order) {
  const placedAt = order.placedAt || order.date
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : []
  const timeline = history.length
    ? [...history]
    : [
        {
          status: 'Placed',
          paymentStatus: order.paymentStatus || 'pending',
          note: 'Order placed',
          at: placedAt,
          by: null,
        },
      ]
  return timeline
    .map((entry) => ({
      ...entry,
      note: timelineLabel(entry),
      at: entry?.at || placedAt,
    }))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .slice(-14)
}
