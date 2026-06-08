/**
 * Admin matrix form ↔ flat product.variants[] (Color + Size attributes per SKU).
 */

import { buildVariantKey, getVariantColor, getVariantSize } from './productVariants'

const EMPTY_SKU_DETAIL = () => ({
  sku: '',
})

const EMPTY_COLOR_ROW = () => ({
  colorName: '',
  imagesMeta: [],
  stocks: {},
  skuDetails: {},
})

export function parseSizesInput(raw) {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((s) => String(s).trim()).filter(Boolean))]
  }
  return [...new Set(String(raw || '').split(',').map((s) => s.trim()).filter(Boolean))]
}

/** @param {object[]} variants @param {string[]} [productSizes] */
export function variantsToMatrixForm(variants, productSizes = []) {
  const list = Array.isArray(variants) ? variants : []
  if (list.length === 0) {
    return {
      hasVariants: false,
      variantSizes: parseSizesInput(productSizes).join(', '),
      colorMatrix: [],
    }
  }

  const sizeSet = new Set(parseSizesInput(productSizes))
  const colorMap = new Map()

  for (const v of list) {
    const color = getVariantColor(v) || String(v?.name || '').trim()
    if (!color) continue
    const size = getVariantSize(v) || ''
    if (size) sizeSet.add(size)

    if (!colorMap.has(color)) {
      const urls = Array.isArray(v.images) ? v.images.filter(Boolean) : []
      colorMap.set(color, {
        colorName: color,
        imagesMeta: urls.map((url) => ({ url, alt: '' })),
        stocks: {},
        skuDetails: {},
      })
    }
    const row = colorMap.get(color)
    const sizeKey = size || ''
    if (size) {
      row.stocks[size] = String(v.stock ?? '')
    } else {
      row.stocks[''] = String(v.stock ?? '')
    }
    row.skuDetails[sizeKey] = {
      sku: String(v.sku || '').trim(),
    }
    const urls = Array.isArray(v.images) ? v.images.filter(Boolean) : []
    if (urls.length > 0 && row.imagesMeta.length === 0) {
      row.imagesMeta = urls.map((url) => ({ url, alt: '' }))
    }
  }

  const sizes = [...sizeSet]
  const colorMatrix = [...colorMap.values()]

  return {
    hasVariants: true,
    variantSizes: sizes.join(', '),
    colorMatrix,
  }
}

function imagesFromRow(row) {
  return (Array.isArray(row?.imagesMeta) ? row.imagesMeta : [])
    .map((m) => String(m?.url || '').trim())
    .filter(Boolean)
}

/** Expand admin matrix to API variant rows. */
export function matrixFormToVariants(form) {
  if (!form?.hasVariants) return []

  const sizes = parseSizesInput(form.variantSizes)
  const colors = Array.isArray(form.colorMatrix) ? form.colorMatrix : []
  const variants = []

  for (const row of colors) {
    const colorName = String(row?.colorName || '').trim()
    if (!colorName) continue
    const imageUrls = imagesFromRow(row)
    const stocks = row?.stocks && typeof row.stocks === 'object' ? row.stocks : {}

    const skuDetails = row?.skuDetails && typeof row.skuDetails === 'object' ? row.skuDetails : {}

    if (sizes.length === 0) {
      const stock = Math.max(0, Number(stocks['']) || 0)
      const detail = skuDetails[''] || EMPTY_SKU_DETAIL()
      variants.push({
        name: buildVariantKey(colorName, ''),
        sku: String(detail.sku || '').trim(),
        price: 0,
        stock,
        images: imageUrls,
        attributes: [{ key: 'Color', value: colorName }],
        certification: {
          bisHallmark: false,
          bisLicense: '',
          diamondCertUrl: '',
          diamondCertNumber: '',
        },
      })
      continue
    }

    for (const size of sizes) {
      const stock = Math.max(0, Number(stocks[size]) || 0)
      const detail = skuDetails[size] || EMPTY_SKU_DETAIL()
      variants.push({
        name: buildVariantKey(colorName, size),
        sku: String(detail.sku || '').trim(),
        price: 0,
        stock,
        images: imageUrls,
        attributes: [
          { key: 'Color', value: colorName },
          { key: 'Size', value: size },
        ],
        certification: {
          bisHallmark: false,
          bisLicense: '',
          diamondCertUrl: '',
          diamondCertNumber: '',
        },
      })
    }
  }

  return variants
}

export function matrixHasContent(form) {
  if (!form?.hasVariants) return false
  const colors = Array.isArray(form.colorMatrix) ? form.colorMatrix : []
  return colors.some((row) => String(row?.colorName || '').trim())
}

export function totalMatrixStock(form) {
  let total = 0
  if (!form?.hasVariants) return total
  for (const row of form.colorMatrix || []) {
    const stocks = row?.stocks || {}
    for (const val of Object.values(stocks)) {
      const n = Number(val)
      if (Number.isFinite(n) && n > 0) total += n
    }
  }
  return total
}

export { EMPTY_COLOR_ROW, EMPTY_SKU_DETAIL }
