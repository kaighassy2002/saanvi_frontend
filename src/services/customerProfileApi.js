import { commonAPI } from '../server/comonAPI'
import { SERVER_URL } from '../server/serverURL'
import { STORAGE_KEYS } from './config'

const API_AUTH = `${SERVER_URL}/api/auth`

function customerAuthHeaders() {
  const t = localStorage.getItem(STORAGE_KEYS.customerToken)
  const base = { 'Content-Type': 'application/json' }
  if (t) base.Authorization = `Bearer ${t}`
  return base
}

/** Axios success response or axios error (same as allApi pattern). */
export async function customerGetMeRequest() {
  return commonAPI('GET', `${API_AUTH}/me`, undefined, customerAuthHeaders())
}

export async function customerPatchMeRequest(body) {
  return commonAPI('PATCH', `${API_AUTH}/me`, body, customerAuthHeaders())
}

export function unwrapCustomerApi(result) {
  if (result?.response) {
    const { status, data } = result.response
    const raw =
      (typeof data === 'object' && data != null && data.message) ||
      (typeof data === 'string' ? data : null) ||
      result.message ||
      'Something went wrong'
    const msg = typeof raw === 'string' ? raw : 'Request failed'
    const err = new Error(msg)
    err.statusCode = status
    throw err
  }
  const status = result?.status
  if (status >= 200 && status < 300 && result?.data !== undefined) {
    return result.data
  }
  throw new Error(result?.message || 'Could not reach server')
}
