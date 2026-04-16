import React from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/merchandising', label: 'New arrivals' },
]

export default function AdminLayout() {
  const { isAuthenticated, logout } = useAdminAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return (
    <div className="min-h-screen bg-[#f5ebe0] md:flex">
      <aside className="shrink-0 border-b border-[#3a151d]/15 bg-[#2a1116] text-[#f8f1e6] md:w-56 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-5 md:block">
          <div>
            <p className="text-kicker text-gold-light">
              Console
            </p>
            <p className="font-bodoni text-xl text-white">Admin</p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-full border border-[#5a1f2b] px-3 py-1.5 font-playfair text-xs text-[#e8dcc8] hover:bg-[#3a151d]"
          >
            Log out
          </button>
        </div>
        <nav className="flex flex-wrap gap-1 px-2 pb-4 md:flex-col md:px-3">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2.5 font-playfair text-sm transition md:py-2 ${
                  isActive
                    ? 'bg-gold text-ink'
                    : 'text-[#d4c4b8] hover:bg-[#3a151d]/80 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-[#dcc6a6] bg-white/80 px-4 py-4 backdrop-blur sm:px-8">
          <h1 className="font-bodoni text-2xl text-ink">Jewellery store</h1>
          <p className="font-playfair text-sm text-muted">Manage catalogue, orders, and merchandising</p>
        </header>
        <main className="p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
