const COLOR_KEYWORDS = [
  ['rose gold', 'Rose Gold'],
  ['white gold', 'White Gold'],
  ['yellow gold', 'Yellow Gold'],
  ['gold', 'Gold'],
  ['sterling silver', 'Silver'],
  ['silver', 'Silver'],
  ['platinum', 'Platinum'],
  ['emerald', 'Emerald'],
  ['ruby', 'Ruby'],
  ['sapphire', 'Sapphire'],
  ['pearl', 'Pearl'],
  ['diamond', 'Diamond'],
  ['meenakari', 'Meenakari'],
  ['multicolor', 'Multicolor'],
]

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

export function getProductColor(product) {
  const stored = String(product?.specifications?.color || product?.color || '').trim()
  if (stored) return stored
  return inferFromKeywords(`${product?.name || ''} ${product?.description || ''}`, COLOR_KEYWORDS)
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
