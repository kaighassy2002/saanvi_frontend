import { CATALOG_UPDATED_EVENT, STORAGE_KEYS, STORE_SLUG } from './config'

/** Bump when removing static seed catalog so browsers drop old localStorage products once. */
const CATALOG_SEED_VERSION = '2'

function emitCatalogUpdated() {
  window.dispatchEvent(new Event(CATALOG_UPDATED_EVENT))
}

export function normalizeProduct(raw) {
  const image = raw.image || (raw.images && raw.images[0]) || ''
  const images =
    Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : image ? [image] : []
  return {
    id: raw.id,
    name: raw.name || '',
    category: raw.category || '',
    price: Number(raw.price) || 0,
    originalPrice: Number(raw.originalPrice) || 0,
    image: images[0] || '',
    images,
    description: raw.description || '',
    specifications: raw.specifications || {
      material: '',
      color: '',
      weight: '',
      length: '',
      certification: '',
    },
    material: raw.material || raw.specifications?.material || '',
    weight: raw.weight || raw.specifications?.weight || '',
    sizeOptions: Array.isArray(raw.sizeOptions) ? raw.sizeOptions : [],
    dimensions: {
      length: raw.dimensions?.length || '',
      width: raw.dimensions?.width || '',
      height: raw.dimensions?.height || '',
      unit: raw.dimensions?.unit || 'mm',
    },
    customAttributes: Array.isArray(raw.customAttributes) ? raw.customAttributes : [],
    variants: Array.isArray(raw.variants) ? raw.variants : [],
    published: raw.published !== false,
    stock: raw.stock != null ? Number(raw.stock) : 10,
  }
}

function readJson(key, fallback) {
  try {
    const s = localStorage.getItem(key)
    if (!s) return fallback
    return JSON.parse(s)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  emitCatalogUpdated()
}

function ensureCatalogMigrated() {
  const versionKey = `${STORE_SLUG}_catalog_seed_version`
  if (localStorage.getItem(versionKey) === CATALOG_SEED_VERSION) return
  localStorage.removeItem(STORAGE_KEYS.products)
  localStorage.removeItem(STORAGE_KEYS.newArrivalIds)
  localStorage.setItem(versionKey, CATALOG_SEED_VERSION)
}

export function seedCatalogIfEmpty() {
  ensureCatalogMigrated()
  if (!localStorage.getItem(STORAGE_KEYS.products)) {
    writeJson(STORAGE_KEYS.products, [])
  }
  if (!localStorage.getItem(STORAGE_KEYS.categories)) {
    writeJson(STORAGE_KEYS.categories, [])
  }
  if (!localStorage.getItem(STORAGE_KEYS.newArrivalIds)) {
    writeJson(STORAGE_KEYS.newArrivalIds, [])
  }
}

export function getLocalProductsAll() {
  seedCatalogIfEmpty()
  return readJson(STORAGE_KEYS.products, []).map(normalizeProduct)
}

export function setLocalProducts(products) {
  writeJson(STORAGE_KEYS.products, products.map(normalizeProduct))
}

export function getLocalCategories() {
  seedCatalogIfEmpty()
  return readJson(STORAGE_KEYS.categories, [])
}

export function setLocalCategories(categories) {
  const unique = [...new Set(categories.map((c) => String(c).trim()).filter(Boolean))]
  writeJson(STORAGE_KEYS.categories, unique)
}

export function getLocalNewArrivalIds() {
  seedCatalogIfEmpty()
  return readJson(STORAGE_KEYS.newArrivalIds, [])
}

export function setLocalNewArrivalIds(ids) {
  writeJson(
    STORAGE_KEYS.newArrivalIds,
    [...new Set(ids.map((id) => Number(id)))].filter((n) => !Number.isNaN(n))
  )
}

export function getPublicProductsLocal() {
  return getLocalProductsAll().filter((p) => p.published !== false)
}

export function getProductByIdLocal(id) {
  const nid = Number(id)
  return getLocalProductsAll().find((p) => p.id === nid || String(p.id) === String(id)) || null
}

export function upsertProductLocal(product) {
  const all = getLocalProductsAll()
  const pid = product.id
  const idx = all.findIndex((p) => p.id === Number(pid) || String(p.id) === String(pid))
  let finalId
  let next
  if (idx >= 0) {
    finalId = all[idx].id
    const merged = { ...all[idx], ...product, id: finalId }
    next = [...all]
    next[idx] = normalizeProduct(merged)
  } else {
    const maxId = all.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0)
    finalId =
      pid != null && pid !== '' && !Number.isNaN(Number(pid)) ? Number(pid) : maxId + 1
    next = [...all, normalizeProduct({ ...product, id: finalId })]
  }
  setLocalProducts(next)
  return next.find((p) => p.id === finalId) || null
}

export function deleteProductLocal(id) {
  const nid = Number(id)
  const next = getLocalProductsAll().filter((p) => p.id !== nid)
  setLocalProducts(next)
  const na = getLocalNewArrivalIds().filter((x) => x !== nid)
  setLocalNewArrivalIds(na)
}
