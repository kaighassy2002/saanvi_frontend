import { getVariantColor } from './productVariants'

/** Standard colours shown in the collection sidebar filter */
export const COMMON_FILTER_COLORS = [
  'Gold',
  'Rose Gold',
  'Silver',
  'Red',
  'Green',
  'Blue',
  'White',
  'Purple',
  'Pink',
  'Black',
  'Brown',
  'Multicolor',
]

/** Maps free-text / variant labels → common filter colour (longest match first) */
const COLOR_ALIASES = [
  ['antique gold', 'Gold'],
  ['rose gold', 'Rose Gold'],
  ['white gold', 'Gold'],
  ['yellow gold', 'Gold'],
  ['ruby red', 'Red'],
  ['sterling silver', 'Silver'],
  ['multicolour', 'Multicolor'],
  ['multicolor', 'Multicolor'],
  ['meenakari', 'Multicolor'],
  ['emerald', 'Green'],
  ['sapphire', 'Blue'],
  ['maroon', 'Red'],
  ['crimson', 'Red'],
  ['burgundy', 'Red'],
  ['navy', 'Blue'],
  ['teal', 'Blue'],
  ['violet', 'Purple'],
  ['magenta', 'Pink'],
  ['gold', 'Gold'],
  ['silver', 'Silver'],
  ['ruby', 'Red'],
  ['pearl', 'White'],
  ['diamond', 'White'],
  ['ivory', 'White'],
  ['cream', 'White'],
  ['purple', 'Purple'],
  ['green', 'Green'],
  ['blue', 'Blue'],
  ['red', 'Red'],
  ['pink', 'Pink'],
  ['white', 'White'],
  ['black', 'Black'],
  ['brown', 'Brown'],
  ['orange', 'Red'],
]

const COLOR_KEYWORDS = COLOR_ALIASES

/** Fixed list shown in collection material filter */
export const BASIC_MATERIALS = ['Gold', 'Silver', 'Rose Gold', 'Platinum', 'Brass']

const MATERIAL_ALIASES = [
  ['sterling silver', 'Silver'],
  ['925 silver', 'Silver'],
  ['silver', 'Silver'],
  ['rose gold', 'Rose Gold'],
  ['white gold', 'Gold'],
  ['yellow gold', 'Gold'],
  ['gold', 'Gold'],
  ['platinum', 'Platinum'],
  ['brass', 'Brass'],
]

function matchKeyword(text, keyword) {
  if (keyword.includes(' ')) return text.includes(keyword)
  return new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
}

function inferFromKeywords(text, keywords) {
  const lower = String(text || '').toLowerCase()
  for (const [keyword, label] of keywords) {
    if (matchKeyword(lower, keyword)) return label
  }
  return ''
}

function normalizeToBasicMaterial(raw) {
  const text = String(raw || '').trim()
  if (!text) return ''
  const exact = BASIC_MATERIALS.find((m) => m.toLowerCase() === text.toLowerCase())
  if (exact) return exact
  return inferFromKeywords(text, MATERIAL_ALIASES)
}

export function getProductMaterial(product) {
  const stored = String(product?.specifications?.material || product?.material || '').trim()
  if (stored) return normalizeToBasicMaterial(stored)
  return inferFromKeywords(
    `${product?.name || ''} ${product?.description || ''}`,
    MATERIAL_ALIASES
  )
}

/** Material filter options — basic materials only, in fixed order */
export function buildBasicMaterialFacetOptions(products) {
  const counts = Object.fromEntries(BASIC_MATERIALS.map((m) => [m, 0]))
  for (const product of products) {
    const material = getProductMaterial(product)
    if (material && counts[material] != null) counts[material] += 1
  }
  return BASIC_MATERIALS.map((value) => ({ value, count: counts[value] })).filter(
    (option) => option.count > 0
  )
}

function parseColorTokens(raw) {
  return [
    ...new Set(
      String(raw || '')
        .split(/[,/&]|(?:\s+and\s+)/i)
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ]
}

function normalizeColorToken(raw) {
  const text = String(raw || '').trim()
  if (!text) return ''

  const exact = COMMON_FILTER_COLORS.find((c) => c.toLowerCase() === text.toLowerCase())
  if (exact) return exact

  const inferred = inferFromKeywords(text, COLOR_ALIASES)
  if (inferred && COMMON_FILTER_COLORS.includes(inferred)) return inferred

  const titled = text
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
  if (COMMON_FILTER_COLORS.includes(titled)) return titled

  return ''
}

function normalizeColorLabels(rawLabels) {
  const normalized = new Set()
  for (const raw of rawLabels) {
    for (const token of parseColorTokens(raw)) {
      const color = normalizeColorToken(token)
      if (color) normalized.add(color)
    }
  }
  return [...normalized]
}

/** All common colour labels for a product (variants + spec colour, comma-separated values split). */
export function getProductColorLabels(product) {
  const rawLabels = []
  const variants = Array.isArray(product?.variants) ? product.variants : []
  for (const variant of variants) {
    const color = getVariantColor(variant)
    if (color) rawLabels.push(color)
  }

  if (rawLabels.length === 0) {
    const stored = String(product?.specifications?.color || product?.color || '').trim()
    if (stored) rawLabels.push(stored)
    else {
      const inferred = inferFromKeywords(
        `${product?.name || ''} ${product?.description || ''}`,
        COLOR_KEYWORDS
      )
      if (inferred) rawLabels.push(inferred)
    }
  }

  return normalizeColorLabels(rawLabels)
}

/** Primary colour label for display (first variant or spec colour). */
export function getProductColor(product) {
  const labels = getProductColorLabels(product)
  return labels[0] || ''
}

export function productMatchesColorFacet(product, selectedColors) {
  if (!selectedColors.length) return true
  const labels = getProductColorLabels(product).map((v) => v.toLowerCase())
  if (labels.length === 0) return false
  return selectedColors.some((s) => labels.includes(String(s).toLowerCase()))
}

/** @returns {{ value: string, count: number }[]} — common colours only, fixed display order */
export function buildColorFacetOptions(products) {
  const counts = Object.fromEntries(COMMON_FILTER_COLORS.map((c) => [c, 0]))
  for (const product of products) {
    for (const value of getProductColorLabels(product)) {
      if (counts[value] != null) counts[value] += 1
    }
  }
  return COMMON_FILTER_COLORS.map((value) => ({ value, count: counts[value] })).filter(
    (option) => option.count > 0
  )
}

/** @returns {{ value: string, count: number }[]} */
export function buildFacetOptions(products, getter) {
  const counts = {}
  for (const product of products) {
    const value = getter(product)
    if (!value) continue
    counts[value] = (counts[value] || 0) + 1
  }
  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

export function parseCommaList(raw) {
  if (!raw) return []
  return [...new Set(String(raw).split(',').map((s) => s.trim()).filter(Boolean))]
}

export function productMatchesFacet(selected, value) {
  if (!selected.length) return true
  if (!value) return false
  const norm = value.toLowerCase()
  return selected.some((s) => s.toLowerCase() === norm)
}
