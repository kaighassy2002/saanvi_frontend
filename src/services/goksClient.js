/**
 * Saanvi storefront API adapter.
 *
 * Wraps @goks/storefront-sdk with this site's env config.
 * To plug a new client site in: copy this file, set the 3 env vars — done.
 *
 * VITE_API_URL        = Goks backend origin
 * VITE_STORE_SLUG     = tenant slug in Goks
 * VITE_STOREFRONT_KEY = from Goks → Settings → Storefront → Rotate Token
 */
import { createGoksClient } from '@goks/storefront-sdk'

const client = createGoksClient({
  apiUrl: import.meta.env.VITE_API_URL || '',
  slug: import.meta.env.VITE_STORE_SLUG || 'saanvi',
  storefrontKey: import.meta.env.VITE_STOREFRONT_KEY || '',
  devProxy: import.meta.env.DEV && import.meta.env.VITE_DEV_PROXY === 'true',
})

export const fetchGoksStore = () => client.fetchStore()
export const fetchGoksCategories = () => client.fetchCategories()
export const fetchGoksFeatured = () => client.fetchFeatured()
export const fetchGoksProducts = (params) => client.fetchProducts(params)
export const fetchGoksProduct = (id) => client.fetchProduct(id)
export const goksRequestOTP = (contact, type) => client.requestOTP(contact, type)
export const goksVerifyOTP = (contact, type, code) => client.verifyOTP(contact, type, code)
export const goksGetMe = (token) => client.getMe(token)
export const goksPatchMe = (token, data) => client.patchMe(token, data)
