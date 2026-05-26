import { STORE_SLUG } from './config'

const MAX = 8
const key = () => `${STORE_SLUG}_recent_searches`

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(key())
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string' && s.trim()) : []
  } catch {
    return []
  }
}

export function pushRecentSearch(term) {
  const trimmed = String(term || '').trim()
  if (!trimmed) return
  const prev = getRecentSearches().filter((s) => s.toLowerCase() !== trimmed.toLowerCase())
  const next = [trimmed, ...prev].slice(0, MAX)
  localStorage.setItem(key(), JSON.stringify(next))
}
