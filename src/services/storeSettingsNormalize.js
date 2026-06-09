import {
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_FEE,
  STORE_LOCATION,
  STORE_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  WHATSAPP_PHONE,
} from './storefrontConstants'

/** Normalize public store-settings API payload for React context */
export function normalizeStoreSettings(data) {
  const shipping = data?.shipping ?? {}
  const fee = Number(shipping.shippingFee)
  const threshold = Number(shipping.freeShippingThreshold)
  const heroSlides = Array.isArray(data?.heroSlides) ? data.heroSlides : []
  const featuredProductIds = Array.isArray(data?.featuredProductIds)
    ? data.featuredProductIds.map(String).filter(Boolean)
    : []
  const homeCategoryImages = Array.isArray(data?.homeCategoryImages) ? data.homeCategoryImages : []
  const promoBanners = Array.isArray(data?.promoBanners) ? data.promoBanners : []
  const homeServices = Array.isArray(data?.homeServices) ? data.homeServices : []
  const homeSections =
    data?.homeSections && typeof data.homeSections === 'object' ? data.homeSections : {}

  return {
    storeName: String(data?.storeName || '').trim() || STORE_NAME,
    supportEmail: String(data?.supportEmail || '').trim() || SUPPORT_EMAIL,
    supportPhone: String(data?.supportPhone || '').trim() || SUPPORT_PHONE,
    storeLocation: String(data?.storeLocation || '').trim() || STORE_LOCATION,
    whatsappPhone: String(data?.whatsappPhone || '').replace(/\D/g, '') || WHATSAPP_PHONE,
    announcementMessage: String(data?.announcementMessage || '').trim(),
    instagramUrl: String(data?.instagramUrl || '').trim(),
    codEnabled: data?.codEnabled !== false,
    shippingFee:
      Number.isFinite(fee) && fee >= 0 ? fee : DEFAULT_SHIPPING_FEE,
    freeShippingThreshold:
      Number.isFinite(threshold) && threshold >= 0
        ? threshold
        : DEFAULT_FREE_SHIPPING_THRESHOLD,
    heroSlides,
    featuredProductIds,
    homeCategoryImages,
    promoBanners,
    homeServices,
    homeSections,
  }
}

export function settingsFormFromApi(s) {
  return {
    storeName: s.storeName || STORE_NAME,
    supportEmail: s.supportEmail || SUPPORT_EMAIL,
    supportPhone: s.supportPhone || SUPPORT_PHONE,
    storeLocation: s.storeLocation || STORE_LOCATION,
    storeState: s.storeState || '',
    storeGstin: s.storeGstin || '',
    defaultGstPercent: s.defaultGstPercent ?? 3,
    defaultHsnCode: s.defaultHsnCode || '7113',
    codConfirmThreshold: s.codConfirmThreshold ?? 10000,
    codEnabled: s.codEnabled !== false,
    whatsappPhone: s.whatsappPhone || '',
    announcementMessage: s.announcementMessage || '',
    instagramUrl: s.instagramUrl || '',
    shippingFee: s.shipping?.shippingFee ?? DEFAULT_SHIPPING_FEE,
    freeShippingThreshold: s.shipping?.freeShippingThreshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD,
  }
}

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
]

export function validateSettingsForm(form) {
  const errors = {}
  if (!String(form.storeName || '').trim()) errors.storeName = 'Store name is required'
  const email = String(form.supportEmail || '').trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.supportEmail = 'Invalid email'
  const phone = String(form.supportPhone || '').replace(/\D/g, '')
  if (phone && phone.slice(-10).length !== 10) errors.supportPhone = 'Enter a 10-digit mobile number'
  const gstin = String(form.storeGstin || '').trim().toUpperCase()
  if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
    errors.storeGstin = 'Invalid GSTIN format'
  }
  const gst = Number(form.defaultGstPercent)
  if (!Number.isFinite(gst) || gst < 0 || gst > 28) errors.defaultGstPercent = 'GST must be 0–28%'
  const fee = Number(form.shippingFee)
  if (!Number.isFinite(fee) || fee < 0) errors.shippingFee = 'Invalid shipping fee'
  const threshold = Number(form.freeShippingThreshold)
  if (!Number.isFinite(threshold) || threshold < 0) errors.freeShippingThreshold = 'Invalid threshold'
  return errors
}

export function payloadFromSettingsForm(form) {
  return {
    storeName: form.storeName.trim(),
    supportEmail: form.supportEmail.trim(),
    supportPhone: form.supportPhone.trim(),
    storeLocation: form.storeLocation.trim(),
    storeState: form.storeState.trim(),
    storeGstin: form.storeGstin.trim().toUpperCase(),
    defaultGstPercent: Number(form.defaultGstPercent),
    defaultHsnCode: form.defaultHsnCode.trim(),
    codConfirmThreshold: Math.round(Number(form.codConfirmThreshold) || 0),
    codEnabled: !!form.codEnabled,
    whatsappPhone: String(form.whatsappPhone || '').replace(/\D/g, ''),
    announcementMessage: form.announcementMessage.trim(),
    instagramUrl: form.instagramUrl.trim(),
    shipping: {
      shippingFee: Math.round(Number(form.shippingFee) || 0),
      freeShippingThreshold: Math.round(Number(form.freeShippingThreshold) || 0),
    },
  }
}
