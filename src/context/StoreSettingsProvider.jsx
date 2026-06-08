import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { USE_LOCAL_API } from '../services/config'
import { fetchStoreSettings } from '../services/jewelleryApi'
import {
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_FEE,
} from '../services/storefrontConstants'
import { HOME_HERO_SLIDES } from '../User_pages/data/homeContent'
import { defaultStoreSettings, StoreSettingsContext } from './storeSettingsContext'

function normalizeStoreSettings(data) {
  const shipping = data?.shipping ?? {}
  const fee = Number(shipping.shippingFee)
  const threshold = Number(shipping.freeShippingThreshold)
  const heroSlides = Array.isArray(data?.heroSlides) ? data.heroSlides : []
  const featuredProductIds = Array.isArray(data?.featuredProductIds)
    ? data.featuredProductIds.map(String).filter(Boolean)
    : []
  const homeCategoryImages = Array.isArray(data?.homeCategoryImages) ? data.homeCategoryImages : []

  return {
    shippingFee:
      Number.isFinite(fee) && fee >= 0 ? fee : DEFAULT_SHIPPING_FEE,
    freeShippingThreshold:
      Number.isFinite(threshold) && threshold >= 0
        ? threshold
        : DEFAULT_FREE_SHIPPING_THRESHOLD,
    heroSlides,
    featuredProductIds,
    homeCategoryImages,
  }
}

function localDemoSettings() {
  return {
    ...defaultStoreSettings,
    heroSlides: HOME_HERO_SLIDES.map(({ tag, title, subtitle, image, link }) => ({
      image: image || '',
      tag: tag || '',
      title: title || '',
      subtitle: subtitle || '',
      link: link || '/collections',
    })),
    featuredProductIds: [],
  }
}

function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(
    USE_LOCAL_API ? localDemoSettings() : defaultStoreSettings
  )
  const [ready, setReady] = useState(USE_LOCAL_API)

  const refresh = useCallback(async () => {
    if (USE_LOCAL_API) {
      setSettings(localDemoSettings())
      setReady(true)
      return
    }
    try {
      const data = await fetchStoreSettings()
      setSettings(normalizeStoreSettings(data))
    } catch {
      setSettings(defaultStoreSettings)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      shippingFee: settings.shippingFee,
      freeShippingThreshold: settings.freeShippingThreshold,
      heroSlides: settings.heroSlides,
      featuredProductIds: settings.featuredProductIds,
      homeCategoryImages: settings.homeCategoryImages,
      ready,
      refresh,
    }),
    [settings, ready, refresh]
  )

  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>
}

export default StoreSettingsProvider
