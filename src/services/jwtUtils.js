/**
 * Decode JWT payload (no signature verification — backend must validate).
 * Returns null if invalid.
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function isAdminFromPayload(payload) {
  if (!payload) return false
  const role = String(payload.role || '').toLowerCase()
  return role === 'admin' || role === 'superadmin'
}
