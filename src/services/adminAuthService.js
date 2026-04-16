import { USE_LOCAL_API } from './config'
import { apiRequest, setStoredToken, getStoredToken } from './apiClient'
import { decodeJwtPayload, isAdminFromPayload } from './jwtUtils'

/** Demo local admin — change when backend provides real credentials. */
const LOCAL_ADMIN_EMAIL = 'admin@jewellery.com'
const LOCAL_ADMIN_PASSWORD = 'admin123'

function buildMockJwt(payload) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `${header}.${body}.local`
}

/**
 * POST /api/admin/auth/login { email, password } -> { token }
 * or local demo when VITE_API_URL is unset.
 */
export async function adminLogin(email, password) {
  if (USE_LOCAL_API) {
    if (email === LOCAL_ADMIN_EMAIL && password === LOCAL_ADMIN_PASSWORD) {
      const token = buildMockJwt({
        role: 'admin',
        email: LOCAL_ADMIN_EMAIL,
        exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      })
      setStoredToken(token)
      return { token, user: decodeJwtPayload(token) }
    }
    throw new Error('Invalid email or password')
  }
  const data = await apiRequest('/api/admin/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
  const token = data.token || data.accessToken
  if (!token) throw new Error('No token in response')
  setStoredToken(token)
  return { token, user: data.user || decodeJwtPayload(token) }
}

export function adminLogout() {
  setStoredToken(null)
}

export function getAdminSession() {
  const token = getStoredToken()
  if (!token) return null
  const payload = decodeJwtPayload(token)
  if (!isAdminFromPayload(payload)) return null
  if (payload.exp != null && payload.exp < Math.floor(Date.now() / 1000)) {
    setStoredToken(null)
    return null
  }
  return { token, payload }
}

export { LOCAL_ADMIN_EMAIL, LOCAL_ADMIN_PASSWORD }
