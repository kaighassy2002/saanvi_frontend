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

/** POST /api/auth/forgot-password/request */
export const requestPasswordResetOtpAPI = async (reqBody) => {
  return await commonAPI('POST', `${API_AUTH}/forgot-password/request`, reqBody)
}

/** POST /api/auth/forgot-password/verify */
export const verifyPasswordResetOtpAPI = async (reqBody) => {
  return await commonAPI('POST', `${API_AUTH}/forgot-password/verify`, reqBody)
}

/** POST /api/auth/forgot-password/reset */
export const resetPasswordWithOtpAPI = async (reqBody) => {
  return await commonAPI('POST', `${API_AUTH}/forgot-password/reset`, reqBody)
}
