import { commonAPI } from './comonAPI'
import { SERVER_URL } from './serverURL'

const API_AUTH = `${SERVER_URL}/api/auth`

/** POST /api/auth/register */
export const registerAPI = async (reqBody) => {
  return await commonAPI('POST', `${API_AUTH}/register`, reqBody)
}

/** POST /api/auth/login */
export const loginAPI = async (reqBody) => {
  return await commonAPI('POST', `${API_AUTH}/login`, reqBody)
}
