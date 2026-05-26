import { STORAGE_KEYS, USE_LOCAL_API } from './config'
import { customerGetMe, customerPatchMe } from './jewelleryApi'

export function unwrapCustomerApi(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data
  }
  return payload
}

export async function customerGetMeRequest() {
  if (USE_LOCAL_API) {
    const raw = localStorage.getItem(STORAGE_KEYS.customerProfile)
    if (!raw) throw new Error('Not signed in')
    return JSON.parse(raw)
  }
  return customerGetMe()
}

export async function customerPatchMeRequest(body) {
  if (USE_LOCAL_API) {
    const raw = localStorage.getItem(STORAGE_KEYS.customerProfile)
    if (!raw) throw new Error('Not signed in')
    const prev = JSON.parse(raw)
    const next = { ...prev, ...body }
    localStorage.setItem(STORAGE_KEYS.customerProfile, JSON.stringify(next))
    return next
  }
  return customerPatchMe(body)
}
