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

export const STORAGE_KEYS = {
  customerToken: 'jewellery_customer_token',
  /** JSON snapshot from login/register `user` for header display */
  customerProfile: 'jewellery_customer_profile',
  /** Local-only address fields (not stored on Customer API) */
  customerAddress: 'jewellery_customer_address',
  adminToken: 'jewellery_admin_token',
  products: 'jewellery_catalog_products',
  categories: 'jewellery_catalog_categories',
  newArrivalIds: 'jewellery_merch_new_arrival_ids',
  orders: 'jewellery_admin_orders',
  customers: 'jewellery_admin_customers',
  shopCart: 'jewellery_shop_cart',
  shopWishlist: 'jewellery_shop_wishlist',
}

export const CATALOG_UPDATED_EVENT = 'jewellery-catalog-updated'
export const ORDERS_UPDATED_EVENT = 'jewellery-orders-updated'
/** Login / logout — cart & wishlist rehydrate from per-user storage */
export const CUSTOMER_SESSION_CHANGED_EVENT = 'jewellery-customer-session-changed'
/** Storefront /orders list should reload (scoped checkout writes) */
export const STOREFRONT_ORDERS_UPDATED_EVENT = 'jewellery-storefront-orders-updated'
