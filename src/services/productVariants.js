const COLOR_ATTR_KEYS = new Set(['color', 'colour', 'stone color', 'stone colour'])
const SIZE_ATTR_KEYS = new Set(['size', 'sizes'])

export const VARIANT_KEY_SEP = '::'

function normKey(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
}

export function getVariantColor(variant) {
  const attrs = Array.isArray(variant?.attributes) ? variant.attributes : []
  for (const attr of attrs) {
    if (COLOR_ATTR_KEYS.has(normKey(attr?.key))) {
      const value = String(attr?.value || '').trim()
      if (value) return value
    }
  }
  const { color } = parseVariantKey(variant?.name)
  return color
}

export function getVariantSize(variant) {
  const attrs = Array.isArray(variant?.attributes) ? variant.attributes : []
  for (const attr of attrs) {
    if (SIZE_ATTR_KEYS.has(normKey(attr?.key))) {
      const value = String(attr?.value || '').trim()
      if (value) return value
    }
  }
  const { size } = parseVariantKey(variant?.name)
  return size
}

/** Stable cart / order line key: `Color::Size` or colour-only legacy name. */
export function buildVariantKey(color, size = '') {
  const c = String(color || '').trim()
  const s = String(size || '').trim()
  if (!c) return s
  if (!s) return c
  return `${c}${VARIANT_KEY_SEP}${s}`
}

export function parseVariantKey(key) {
  const raw = String(key ?? '').trim()
  if (!raw) return { color: '', size: '' }
  const idx = raw.indexOf(VARIANT_KEY_SEP)
  if (idx === -1) return { color: raw, size: '' }
  return { color: raw.slice(0, idx), size: raw.slice(idx + VARIANT_KEY_SEP.length) }
}

export function productHasVariants(product) {
  return Array.isArray(product?.variants) && product.variants.length > 0
}

/** Total units across variant SKUs, or parent stock when no variants. */
export function getProductAvailableStock(product) {
  if (productHasVariants(product)) {
    return getProductVariants(product).reduce(
      (sum, v) => sum + Math.max(0, Number(v?.stock) || 0),
      0
    )
  }
  return Math.max(0, Number(product?.stock) || 0)
}

export function productIsInStock(product) {
  return getProductAvailableStock(product) > 0
}

export function getProductVariants(product) {
  return Array.isArray(product?.variants) ? product.variants : []
}

export function findVariant(product, color, size = '') {
  const variants = getProductVariants(product)
  const key = buildVariantKey(color, size)
  const byKey = variants.find((v) => String(v?.name || '').trim() === key)
  if (byKey) return byKey

  const c = String(color || '').trim().toLowerCase()
  const s = String(size || '').trim().toLowerCase()
  return (
    variants.find((v) => {
      const vc = getVariantColor(v).toLowerCase()
      const vs = getVariantSize(v).toLowerCase()
      if (c && vc !== c) return false
      if (s && vs !== s) return false
      if (!s && vs) return false
      if (!c) return false
      return true
    }) || null
  )
}

export function getProductSizeList(product) {
  const fromProduct = Array.isArray(product?.sizeOptions)
    ? product.sizeOptions.map((x) => String(x).trim()).filter(Boolean)
    : []
  const fromVariants = new Set(fromProduct)
  for (const v of getProductVariants(product)) {
    const size = getVariantSize(v)
    if (size) fromVariants.add(size)
  }
  return [...fromVariants]
}

/** Unique colours with gallery + aggregate stock for storefront swatches. */
export function getColorVariantOptions(product) {
  const variants = getProductVariants(product)
  const byColor = new Map()

  for (const variant of variants) {
    const color = getVariantColor(variant)
    if (!color) continue
    const size = getVariantSize(variant)
    const stock = Math.max(0, Number(variant?.stock) || 0)
    const variantImages = Array.isArray(variant?.images) ? variant.images.filter(Boolean) : []
    const productImages = Array.isArray(product?.images) ? product.images.filter(Boolean) : []

    if (!byColor.has(color)) {
      byColor.set(color, {
        color,
        variantKey: buildVariantKey(color, ''),
        label: color,
        stock: 0,
        image: variantImages[0] || productImages[0] || product?.image || '',
        images: variantImages.length > 0 ? variantImages : productImages,
      })
    }
    const row = byColor.get(color)
    row.stock += stock
    if (variantImages.length > 0 && !row.image) {
      row.image = variantImages[0]
      row.images = variantImages
    }
  }

  return [...byColor.values()].map((row) => ({
    variantName: row.color,
    color: row.color,
    label: row.label,
    stock: row.stock,
    inStock: row.stock > 0,
    image: row.image,
    images: row.images,
  }))
}

/** Sizes available for a colour (with per-size stock). */
export function getSizeOptionsForColor(product, color) {
  const c = String(color || '').trim()
  if (!c) return []

  const sizes = new Map()
  for (const v of getProductVariants(product)) {
    if (getVariantColor(v) !== c) continue
    const size = getVariantSize(v)
    const key = size || ''
    const stock = Math.max(0, Number(v?.stock) || 0)
    if (!sizes.has(key)) {
      sizes.set(key, { size: key, label: key || 'One size', stock: 0, inStock: false })
    }
    const row = sizes.get(key)
    row.stock += stock
    row.inStock = row.stock > 0
  }

  const list = [...sizes.values()]
  if (list.length === 0) {
    return getProductSizeList(product).map((size) => ({
      size,
      label: size,
      stock: Math.max(0, Number(product?.stock) || 0),
      inStock: Number(product?.stock) > 0,
    }))
  }

  return list.filter((r) => r.size !== '' || list.length === 1)
}

export function resolveProductLine(product, color = '', size = '') {
  const basePrice = Math.max(0, Number(product?.price) || 0)
  const baseStock = Math.max(0, Number(product?.stock) || 0)
  const images = Array.isArray(product?.images) ? product.images.filter(Boolean) : []
  const baseImage = images[0] || product?.image || ''

  const hasMatrix = productHasVariants(product)
  if (!hasMatrix) {
    return {
      variantKey: '',
      color: '',
      size: '',
      variantLabel: '',
      price: basePrice,
      stock: baseStock,
      image: baseImage,
      images,
    }
  }

  const variant = findVariant(product, color, size)
  if (!variant) {
    return {
      variantKey: buildVariantKey(color, size),
      color,
      size,
      variantLabel: [color, size].filter(Boolean).join(' · '),
      price: basePrice,
      stock: 0,
      image: baseImage,
      images,
    }
  }

  const variantPrice = Number(variant.price)
  const variantImages = Array.isArray(variant.images) ? variant.images.filter(Boolean) : []
  const gallery = variantImages.length > 0 ? variantImages : images
  const vColor = getVariantColor(variant)
  const vSize = getVariantSize(variant)

  return {
    variantKey: String(variant.name || '').trim() || buildVariantKey(vColor, vSize),
    color: vColor,
    size: vSize,
    variantLabel: [vColor, vSize].filter(Boolean).join(' · '),
    price: Number.isFinite(variantPrice) && variantPrice > 0 ? variantPrice : basePrice,
    stock: Math.max(0, Number(variant.stock) || 0),
    image: variantImages[0] || baseImage,
    images: gallery,
  }
}

export function cartLineKey(productId, variantKey = '') {
  const id = String(productId ?? '').trim()
  const key = String(variantKey || '').trim()
  return key ? `${id}::${key}` : id
}

export function parseCartLineKey(lineKey) {
  const raw = String(lineKey ?? '')
  const firstSep = raw.indexOf('::')
  if (firstSep === -1) return { productId: raw, variantKey: '' }
  const productId = raw.slice(0, firstSep)
  const variantKey = raw.slice(firstSep + 2)
  return { productId, variantKey }
}

export function formatCartItemName(productName, variantLabel) {
  const base = String(productName || '').trim() || 'Product'
  const extra = String(variantLabel || '').trim()
  return extra ? `${base} — ${extra}` : base
}

/** @deprecated Use resolveProductLine(product, color, size) */
export function findVariantByName(product, variantName) {
  return findVariant(product, ...Object.values(parseVariantKey(variantName)))
}

/** @deprecated */
export const getStoneColorOptions = getColorVariantOptions
export const productHasColorVariants = productHasVariants
export const productHasStoneColorOptions = productHasVariants
export function getVariantColorLabel(variant) {
  return getVariantColor(variant)
}
