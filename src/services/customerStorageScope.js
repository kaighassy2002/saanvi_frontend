import { CUSTOMER_SESSION_CHANGED_EVENT, STORAGE_KEYS } from './config'
import { decodeJwtPayload } from './jwtUtils'

/** True when a customer JWT is stored (browser only). */
export function isCustomerLoggedIn() {
  if (typeof localStorage === 'undefined') return false
  return Boolean(localStorage.getItem(STORAGE_KEYS.customerToken))
}

/** `guest` when logged out; Mongo user id string when JWT present. */
export function getCustomerStorageScope() {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.customerToken)
    if (!token) return 'guest'
    const p = decodeJwtPayload(token)
    return p?.sub ? String(p.sub) : 'guest'
  } catch {
    return 'guest'
  }
}

export function scopedCartKey(scope) {
  return `${STORAGE_KEYS.shopCart}::__scope_${scope}`
}

export function scopedWishlistKey(scope) {
  return `${STORAGE_KEYS.shopWishlist}::__scope_${scope}`
}

export function scopedStorefrontOrdersKey(scope) {
  return `jewellery_storefront_orders::__scope_${scope}`
}

/** Call after login / register / logout so cart, wishlist, and orders rebind to the right user. */
export function notifyCustomerSessionChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CUSTOMER_SESSION_CHANGED_EVENT))
}
