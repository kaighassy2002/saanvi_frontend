import React, { createContext, useContext, useState, useCallback } from 'react'
import { STORAGE_KEYS } from '../services/config'
import { adminFetch, adminLoginRequest } from '../services/jewelleryApi'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.adminToken))
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`${STORAGE_KEYS.adminToken}_profile`) || 'null')
    } catch {
      return null
    }
  })

  const login = useCallback(async (email, password) => {
    const data = await adminLoginRequest(email, password)
    const t = data.token
    const user = data.user || { email, role: 'admin' }
    localStorage.setItem(STORAGE_KEYS.adminToken, t)
    localStorage.setItem(`${STORAGE_KEYS.adminToken}_profile`, JSON.stringify(user))
    setToken(t)
    setProfile(user)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.adminToken)
    localStorage.removeItem(`${STORAGE_KEYS.adminToken}_profile`)
    setToken(null)
    setProfile(null)
  }, [])

  const authFetch = useCallback(
    async (path, opts = {}) => {
      const { method = 'GET', body, ...rest } = opts
      try {
        return await adminFetch(path, {
          method,
          body: typeof body === 'string' ? JSON.parse(body) : body,
          ...rest,
        })
      } catch (err) {
        if (err?.status === 401 || err?.status === 403) {
          logout()
          throw new Error(err?.status === 403 ? 'Access denied — please sign in again' : 'Session expired')
        }
        throw err
      }
    },
    [logout]
  )

  return (
    <AdminAuthContext.Provider value={{ token, profile, login, logout, authFetch, isAdmin: !!token }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
