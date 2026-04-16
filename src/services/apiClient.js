import { API_BASE, STORAGE_KEYS } from './config'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getStoredToken() {
  return localStorage.getItem(STORAGE_KEYS.adminToken)
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(STORAGE_KEYS.adminToken, token)
  else localStorage.removeItem(STORAGE_KEYS.adminToken)
}

/**
 * @param {string} path - e.g. /api/products
 * @param {{ method?: string, body?: object, auth?: boolean }} options
 */
export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, auth = true } = options
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const t = getStoredToken()
    if (t) headers['Authorization'] = `Bearer ${t}`
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  if (!res.ok) {
    const msg = typeof data === 'object' && data?.message ? data.message : text || res.statusText
    throw new ApiError(String(msg), res.status)
  }
  return data
}
