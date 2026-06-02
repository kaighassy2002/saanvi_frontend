/** Shared storefront copy and contact — single source for Phase 1+ */

/** Fallback when store settings API is unavailable (local-only mode). */
export const DEFAULT_FREE_SHIPPING_THRESHOLD = 2999
export const DEFAULT_SHIPPING_FEE = 99

/** @deprecated Use useStoreSettings() — kept for static copy fallbacks */
export const FREE_SHIPPING_THRESHOLD = DEFAULT_FREE_SHIPPING_THRESHOLD
/** @deprecated Use useStoreSettings() */
export const SHIPPING_FEE = DEFAULT_SHIPPING_FEE

export const SUPPORT_EMAIL = 'info@aashmikadesigns.com'
export const SUPPORT_PHONE = '+91 98765 43210'
export const SUPPORT_PHONE_TEL = SUPPORT_PHONE.replace(/\s/g, '')
export const STORE_LOCATION = 'Chennai, India'
export const STORE_NAME = 'Aashmika Designs'

/** Brand mark: jewellery_frontend/public/icon/Aashmika-logo.png */
export const BRAND_LOGO_SRC = '/icon/Aashmika-logo.png'

const DEFAULT_WHATSAPP_DIGITS = '919876543210'

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

/** India WhatsApp number (country code 91, no +). Env: VITE_STORE_WHATSAPP */
export const WHATSAPP_PHONE =
  digitsOnly(import.meta.env.VITE_STORE_WHATSAPP) || DEFAULT_WHATSAPP_DIGITS

export function formatInr(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

export function whatsappUrl(message) {
  const base = `https://wa.me/${WHATSAPP_PHONE}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}
