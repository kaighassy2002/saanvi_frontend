/**
 * @param {Array} catalog
 * @param {{ id: string|number, category?: string }} current
 * @param {number} limit
 */
export function getRelatedProducts(catalog, current, limit = 4) {
  if (!catalog?.length || current?.id == null) return []
  const id = String(current.id)
  const category = String(current.category || '').trim()

  const sameCategory = catalog.filter(
    (p) =>
      String(p.id) !== id &&
      p.published !== false &&
      Number(p.stock ?? 0) > 0 &&
      (category ? p.category === category : true)
  )

  const fallback = catalog.filter(
    (p) => String(p.id) !== id && p.published !== false && Number(p.stock ?? 0) > 0
  )

  const pool = sameCategory.length ? sameCategory : fallback
  return pool.slice(0, limit)
}
