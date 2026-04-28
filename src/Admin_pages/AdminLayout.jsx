import React from 'react'
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { API_BASE } from '../services/config'

const GOKS_URL = API_BASE.replace('/api', '') || 'http://localhost:3001'

function AdminLayout() {
  const { isAdmin, logout, profile } = useAdminAuth()
  const navigate = useNavigate()

  if (!isAdmin) return <Navigate to="/admin/login" replace />

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen flex bg-[#faf7f2]">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-[#e8d5c0] flex flex-col py-6 px-4 shrink-0">
        <div className="mb-8">
          <span className="font-playfair text-lg text-ink">Saanvi</span>
          <span className="block text-xs text-muted mt-0.5">Store Admin</span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm transition ${isActive ? 'bg-[#f4e8db] text-ink font-medium' : 'text-muted hover:text-ink hover:bg-[#faf7f2]'}`
            }
          >
            Featured Items
          </NavLink>

          <a
            href={`${GOKS_URL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 rounded-lg text-sm text-muted hover:text-ink hover:bg-[#faf7f2] transition"
          >
            Inventory →
          </a>
          <a
            href={`${GOKS_URL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 rounded-lg text-sm text-muted hover:text-ink hover:bg-[#faf7f2] transition"
          >
            Orders →
          </a>
          <a
            href={`${GOKS_URL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 rounded-lg text-sm text-muted hover:text-ink hover:bg-[#faf7f2] transition"
          >
            Customers →
          </a>
        </nav>

        <div className="mt-auto pt-4 border-t border-[#e8d5c0]">
          <p className="text-xs text-muted mb-2 capitalize">{profile?.role || 'staff'}</p>
          <button
            onClick={handleLogout}
            className="text-sm text-muted hover:text-red-600 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
