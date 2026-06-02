import { createContext, useContext } from 'react'
import {
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_FEE,
} from '../services/storefrontConstants'

export const defaultStoreSettings = {
  shippingFee: DEFAULT_SHIPPING_FEE,
  freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
}

export const StoreSettingsContext = createContext({
  ...defaultStoreSettings,
  ready: false,
  refresh: async () => {},
})

export function useStoreSettings() {
  return useContext(StoreSettingsContext)
}
