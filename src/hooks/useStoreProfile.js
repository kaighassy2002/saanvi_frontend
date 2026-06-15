import { useMemo } from 'react'
import { useStoreSettings } from '../context/storeSettingsContext'
import {
  INSTAGRAM_URL,
  STORE_LOCATION,
  STORE_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
  WHATSAPP_PHONE,
  instagramHandleFromUrl,
  whatsappUrl as buildWhatsappUrl,
} from '../services/storefrontConstants'

/** Store profile with fallbacks — use across footer, contact, invoices, etc. */
export function useStoreProfile() {
  const settings = useStoreSettings()

  return useMemo(() => {
    const storeName = settings.storeName || STORE_NAME
    const supportEmail = settings.supportEmail || SUPPORT_EMAIL
    const supportPhone = settings.supportPhone || SUPPORT_PHONE
    const storeLocation = settings.storeLocation || STORE_LOCATION
    const whatsappPhone = settings.whatsappPhone || WHATSAPP_PHONE
    const phoneTel = String(supportPhone || '').replace(/\s/g, '')

    return {
      storeName,
      supportEmail,
      supportPhone,
      supportPhoneTel: phoneTel || SUPPORT_PHONE_TEL,
      storeLocation,
      whatsappPhone,
      instagramUrl: settings.instagramUrl || INSTAGRAM_URL,
      instagramHandle: instagramHandleFromUrl(settings.instagramUrl || INSTAGRAM_URL),
      announcementMessage: settings.announcementMessage || '',
      codEnabled: settings.codEnabled !== false,
      ready: settings.ready,
      whatsappUrl: (message) => buildWhatsappUrl(message, whatsappPhone),
    }
  }, [settings])
}
