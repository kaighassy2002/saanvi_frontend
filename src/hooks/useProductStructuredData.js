import { useMemo } from 'react'
import { SITE_URL, STORE_NAME } from '../services/storefrontConstants'
import { productImageUrl } from '../utils/cloudinaryImage'
import { productIsInStock } from '../services/productVariants'
import { useStructuredData } from './useStructuredData'

/**
 * Schema.org Product JSON-LD for product detail pages.
 * @param {object | null | undefined} product
 * @param {{ path?: string }} [options]
 */
export function useProductStructuredData(product, { path } = {}) {
  const payload = useMemo(() => {
    if (!product?.id) return null

    const name = product.seoTitle || product.name || 'Product'
    const description =
      product.seoDescription ||
      product.shortDescription ||
      String(product.description || '').slice(0, 500) ||
      `Shop ${name} at ${STORE_NAME}.`
    const images = (Array.isArray(product.images) && product.images.length
      ? product.images
      : product.image
        ? [product.image]
        : []
    )
      .map((url) => productImageUrl(url, 'gallery'))
      .filter(Boolean)

    const price = Number(product.price) || 0
    const inStock = productIsInStock(product)
    const pagePath = path || `/product/${product.id}`
    const pageUrl = `${SITE_URL.replace(/\/$/, '')}${pagePath.startsWith('/') ? pagePath : `/${pagePath}`}`

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description,
      image: images.length ? images : undefined,
      sku: product.sku || undefined,
      brand: {
        '@type': 'Brand',
        name: STORE_NAME,
      },
      offers: {
        '@type': 'Offer',
        url: pageUrl,
        priceCurrency: 'INR',
        price: price.toFixed(2),
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    }
  }, [product, path])

  useStructuredData('product', payload)
}
