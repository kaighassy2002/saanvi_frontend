import { STORE_SLUG } from './config'

const MAX = 12
const key = () => `${STORE_SLUG}_recently_viewed`

export function getRecentlyViewedIds() {
  try {
    const raw = localStorage.getItem(key())
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export function pushRecentlyViewed(productId) {
  const id = String(productId)
  if (!id) return
  const prev = getRecentlyViewedIds().filter((x) => x !== id)
  const next = [id, ...prev].slice(0, MAX)
  localStorage.setItem(key(), JSON.stringify(next))
}
