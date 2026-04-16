import React, { useCallback, useMemo, useState } from 'react'
import {
  adminLogin as loginRequest,
  adminLogout as logoutRequest,
  getAdminSession,
} from '../services/adminAuthService'
import { AdminAuthContext } from './adminAuthContext'

export function AdminAuthProvider({ children }) {
  const [version, setVersion] = useState(0)

  const session = useMemo(() => {
    void version
    return getAdminSession()
  }, [version])

  const login = useCallback(async (email, password) => {
    await loginRequest(email, password)
    setVersion((v) => v + 1)
  }, [])

  const logout = useCallback(() => {
    logoutRequest()
    setVersion((v) => v + 1)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: !!session,
      token: session?.token ?? null,
      payload: session?.payload ?? null,
      login,
      logout,
      refresh: () => setVersion((v) => v + 1),
    }),
    [session, login, logout]
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
