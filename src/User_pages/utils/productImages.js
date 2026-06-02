import { productImageUrl } from '../../utils/cloudinaryImage'

/**
 * Normalize product image fields from API/local catalog into a deduped URL list.
 * @param {{ image?: string, images?: string[] } | null | undefined} product
 * @returns {string[]}
 */
export function getProductImages(product) {
  if (!product) return []
  const fromArray = Array.isArray(product.images)
    ? product.images.map((u) => String(u || '').trim()).filter(Boolean)
    : []
  if (fromArray.length > 0) return [...new Set(fromArray)]
  const single = String(product.image || '').trim()
  return single ? [single] : []
}

export function getProductPrimaryImage(product) {
  const images = getProductImages(product)
  return images[0] || ''
}

/**
 * @param {{ image?: string, images?: string[] } | null | undefined} product
 * @param {'card' | 'gallery' | 'lightbox' | 'thumb' | 'adminPreview'} [preset]
 * @returns {string[]}
 */
export function getProductDisplayImages(product, preset = 'card') {
  return getProductImages(product).map((url) => productImageUrl(url, preset))
}

/**
 * @param {{ image?: string, images?: string[] } | null | undefined} product
 * @param {'card' | 'gallery' | 'lightbox' | 'thumb' | 'adminPreview'} [preset]
 * @returns {string}
 */
export function getProductDisplayPrimaryImage(product, preset = 'card') {
  const raw = getProductPrimaryImage(product)
  return raw ? productImageUrl(raw, preset) : ''
}
