import { createContext, useContext } from 'react'
import {
  DEFAULT_ANNOUNCEMENT_LINK_LABEL,
  DEFAULT_ANNOUNCEMENT_LINK_URL,
} from '../services/announcementBar'
import {
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_FEE,
  INSTAGRAM_URL,
  STORE_LOCATION,
  STORE_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  WHATSAPP_PHONE,
} from '../services/storefrontConstants'

export const defaultStoreSettings = {
  storeName: STORE_NAME,
  supportEmail: SUPPORT_EMAIL,
  supportPhone: SUPPORT_PHONE,
  storeLocation: STORE_LOCATION,
  whatsappPhone: WHATSAPP_PHONE,
  announcementExtraMessage: '',
  announcementMessage: '',
  announcementEnabled: true,
  announcementLinkLabel: DEFAULT_ANNOUNCEMENT_LINK_LABEL,
  announcementLinkUrl: DEFAULT_ANNOUNCEMENT_LINK_URL,
  announcementShowIcon: true,
  instagramUrl: INSTAGRAM_URL,
  codEnabled: true,
  shippingFee: DEFAULT_SHIPPING_FEE,
  freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
  heroSlides: [],
  featuredProductIds: [],
  homeCategoryImages: [],
  promoBanners: [],
  homeServices: [],
  homeSections: {},
}

export const StoreSettingsContext = createContext({
  ...defaultStoreSettings,
  ready: false,
  refresh: async () => {},
})

export function useStoreSettings() {
  return useContext(StoreSettingsContext)
}
