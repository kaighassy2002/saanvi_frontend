const DEFAULT_ORIGIN = 'http://localhost:5000'

function normalizeOrigin(raw) {
  const s = raw == null ? '' : String(raw).trim().replace(/\/$/, '')
  return s || DEFAULT_ORIGIN
}

/** Backend origin (no trailing slash). Uses VITE_API_URL when set, else local default. */
export const SERVER_URL = normalizeOrigin(import.meta.env.VITE_API_URL)
