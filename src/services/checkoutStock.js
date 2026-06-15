import { fetchPublicProductById } from './catalogService'
import { parseCartLineKey, parseVariantKey, resolveProductLine } from './productVariants'
import { ApiError } from './jewelleryApi'

function resolveCartProductId(item) {
  const fromLine = parseCartLineKey(item?.lineKey || '')
  const raw = String(item?.productId || fromLine.productId || '').trim()
  if (!raw || raw === 'undefined' || raw === 'null') {
    return fromLine.productId && fromLine.productId !== 'undefined' ? fromLine.productId : ''
  }
  return raw
}

function isLikelyMongoId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || '').trim())
}

/**
 * Re-fetch stock before placing an order.
 * @param {{ productId: string, name: string, quantity: number, variantName?: string, variantKey?: string }[]} cartItems
 * @returns {Promise<string|null>} Error message or null if OK
 */
export async function validateCartStockForCheckout(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return 'Your cart is empty.'
  }

  const problems = []

  await Promise.all(
    cartItems.map(async (item) => {
      const label = item.name || 'An item'
      const productId = resolveCartProductId(item)
      if (!isLikelyMongoId(productId)) {
        problems.push(`${label} is no longer available. Remove it from your cart and add it again.`)
        return
      }
      let product
      try {
        product = await fetchPublicProductById(productId)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          problems.push(`${label} is no longer available.`)
          return
        }
        throw err
      }
      if (!product || product.published === false) {
        problems.push(`${label} is no longer available.`)
        return
      }
      const key = String(item.variantKey || item.variantName || '').trim()
      const { color, size } = parseVariantKey(key)
      const line = resolveProductLine(product, color, size)
      const stock = line.stock
      if (stock <= 0) {
        problems.push(`${label} is out of stock.`)
        return
      }
      if (item.quantity > stock) {
        problems.push(`${label}: only ${stock} left in stock (you have ${item.quantity}).`)
      }
    })
  )

  if (problems.length === 0) return null
  return problems.join(' ')
}
