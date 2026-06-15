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

/** Public storefront origin for canonical URLs and JSON-LD (no trailing slash). */
export const SITE_URL = String(import.meta.env.VITE_SITE_URL || 'https://www.aashmikadesigns.com').replace(
  /\/$/,
  ''
)

/** Brand mark: jewellery_frontend/public/icon/Aashmika-logo.png */
export const BRAND_LOGO_SRC = '/icon/Aashmika-logo.png'

const DEFAULT_WHATSAPP_DIGITS = '919876543210'

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

/** India WhatsApp number (country code 91, no +). Env: VITE_STORE_WHATSAPP */
export const WHATSAPP_PHONE =
  digitsOnly(import.meta.env.VITE_STORE_WHATSAPP) || DEFAULT_WHATSAPP_DIGITS

/** Instagram profile — full URL. Env: VITE_STORE_INSTAGRAM */
export const DEFAULT_INSTAGRAM_HANDLE = 'aashmikadesigns'
export const INSTAGRAM_URL = String(
  import.meta.env.VITE_STORE_INSTAGRAM || `https://instagram.com/${DEFAULT_INSTAGRAM_HANDLE}`
).trim()

export function instagramHandleFromUrl(url) {
  const trimmed = String(url || '').trim()
  if (!trimmed) return `@${DEFAULT_INSTAGRAM_HANDLE}`
  const match = trimmed.match(/instagram\.com\/([^/?#]+)/i)
  const handle = match?.[1]?.replace(/\/$/, '') || DEFAULT_INSTAGRAM_HANDLE
  return `@${handle}`
}

export function formatInr(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

export function whatsappUrl(message, phoneDigits) {
  const digits = String(phoneDigits || WHATSAPP_PHONE).replace(/\D/g, '') || WHATSAPP_PHONE
  const base = `https://wa.me/${digits}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}
