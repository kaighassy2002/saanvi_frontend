import { STORAGE_KEYS } from './config'
import { goksGetMe, goksPatchMe } from './goksClient'

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.customerToken)
}

export async function customerGetMeRequest() {
  const token = getToken()
  if (!token) throw new Error('Not signed in')
  return goksGetMe(token)
}

export async function customerPatchMeRequest(body) {
  const token = getToken()
  if (!token) throw new Error('Not signed in')
  return goksPatchMe(token, body)
}
