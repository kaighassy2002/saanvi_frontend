function normalizeApiBase(raw) {
  if (raw == null) return ''
  return String(raw).replace(/\r/g, '').trim().replace(/\/$/, '')
}

const viteUrl = normalizeApiBase(import.meta.env.VITE_API_URL)
/** In dev, proxy /api to the backend (see vite.config.js) so requests stay same-origin. */
const useDevProxy = import.meta.env.DEV && import.meta.env.VITE_DEV_PROXY === 'true'

export const API_BASE = useDevProxy ? '' : viteUrl

/** Goks tenant slug — identifies which store's catalog to fetch. Set via VITE_STORE_SLUG. */
export const STORE_SLUG = import.meta.env.VITE_STORE_SLUG || 'saanvi'

/** When empty and not using dev proxy, catalog/orders/users use localStorage. */
export const USE_LOCAL_API = !useDevProxy && !API_BASE

// Keys are prefixed with the tenant slug so multiple client sites on the same
// browser never share localStorage — no session or cart collisions.
const _p = STORE_SLUG
export const STORAGE_KEYS = {
  customerToken: `${_p}_customer_token`,
  customerProfile: `${_p}_customer_profile`,
  customerAddress: `${_p}_customer_address`,
  adminToken: `${_p}_admin_token`,
  products: `${_p}_catalog_products`,
  categories: `${_p}_catalog_categories`,
  newArrivalIds: `${_p}_merch_new_arrival_ids`,
  orders: `${_p}_orders`,
  shopCart: `${_p}_shop_cart`,
  shopWishlist: `${_p}_shop_wishlist`,
}

export const CATALOG_UPDATED_EVENT = 'jewellery-catalog-updated'
export const ORDERS_UPDATED_EVENT = 'jewellery-orders-updated'
/** Login / logout — cart & wishlist rehydrate from per-user storage */
export const CUSTOMER_SESSION_CHANGED_EVENT = 'jewellery-customer-session-changed'
/** Storefront /orders list should reload (scoped checkout writes) */
export const STOREFRONT_ORDERS_UPDATED_EVENT = 'jewellery-storefront-orders-updated'
