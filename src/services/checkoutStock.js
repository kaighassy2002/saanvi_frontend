import { fetchPublicProductById } from './catalogService'
import { parseVariantKey, resolveProductLine } from './productVariants'

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
      const product = await fetchPublicProductById(item.productId)
      const label = item.name || 'An item'
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
