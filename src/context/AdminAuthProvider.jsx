import React, { createContext, useContext, useState, useCallback } from 'react'
import { API_BASE } from '../services/config'

const AdminAuthContext = createContext(null)

const ADMIN_TOKEN_KEY = 'saanvi_admin_token'
const ADMIN_PROFILE_KEY = 'saanvi_admin_profile'

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY))
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY)) } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.detail || 'Login failed')
    const t = data.access_token
    localStorage.setItem(ADMIN_TOKEN_KEY, t)
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify({ role: data.role, tenant_id: data.tenant_id }))
    setToken(t)
    setProfile({ role: data.role, tenant_id: data.tenant_id })
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_PROFILE_KEY)
    setToken(null)
    setProfile(null)
  }, [])

  const authFetch = useCallback(async (path, opts = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        ...opts.headers,
      },
    })
    if (res.status === 401) { logout(); throw new Error('Session expired') }
    const json = await res.json()
    if (!res.ok) throw new Error(json?.detail || 'Request failed')
    return json
  }, [token, logout])

  return (
    <AdminAuthContext.Provider value={{ token, profile, login, logout, authFetch, isAdmin: !!token }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
