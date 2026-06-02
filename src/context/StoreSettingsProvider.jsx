import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { USE_LOCAL_API } from '../services/config'
import { fetchStoreSettings } from '../services/jewelleryApi'
import {
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_FEE,
} from '../services/storefrontConstants'
import { defaultStoreSettings, StoreSettingsContext } from './storeSettingsContext'

function normalizeShipping(data) {
  const shipping = data?.shipping ?? data ?? {}
  const fee = Number(shipping.shippingFee)
  const threshold = Number(shipping.freeShippingThreshold)
  return {
    shippingFee:
      Number.isFinite(fee) && fee >= 0 ? fee : DEFAULT_SHIPPING_FEE,
    freeShippingThreshold:
      Number.isFinite(threshold) && threshold >= 0
        ? threshold
        : DEFAULT_FREE_SHIPPING_THRESHOLD,
  }
}

function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultStoreSettings)
  const [ready, setReady] = useState(USE_LOCAL_API)

  const refresh = useCallback(async () => {
    if (USE_LOCAL_API) {
      setSettings(defaultStoreSettings)
      setReady(true)
      return
    }
    try {
      const data = await fetchStoreSettings()
      setSettings(normalizeShipping(data))
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
      ready,
      refresh,
    }),
    [settings, ready, refresh]
  )

  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>
}

export default StoreSettingsProvider
