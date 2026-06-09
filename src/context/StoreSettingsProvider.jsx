import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { USE_LOCAL_API } from '../services/config'
import { fetchStoreSettings } from '../services/jewelleryApi'
import { normalizeStoreSettings } from '../services/storeSettingsNormalize'
import {
  HOME_HERO_SLIDES,
  HOME_PROMO_BANNERS,
  HOME_SERVICES,
  DEFAULT_HOME_SECTIONS,
} from '../User_pages/data/homeContent'
import { defaultStoreSettings, StoreSettingsContext } from './storeSettingsContext'

function localDemoSettings() {
  return normalizeStoreSettings({
    ...defaultStoreSettings,
    heroSlides: HOME_HERO_SLIDES.map(({ tag, title, subtitle, image, link }) => ({
      image: image || '',
      tag: tag || '',
      title: title || '',
      subtitle: subtitle || '',
      link: link || '/collections',
    })),
    featuredProductIds: [],
    promoBanners: HOME_PROMO_BANNERS,
    homeServices: HOME_SERVICES,
    homeSections: DEFAULT_HOME_SECTIONS,
  })
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
      ...settings,
      ready,
      refresh,
    }),
    [settings, ready, refresh]
  )

  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>
}

export default StoreSettingsProvider
