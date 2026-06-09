import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
import { NavLink, Outlet, Navigate, useNavigate, Link, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { AdminToastProvider } from './shared/AdminToastProvider'
import { getDashboardSummary } from './services/adminApi'
import AdminBreadcrumbs from './components/AdminBreadcrumbs'
import AdminTopBar from './components/AdminTopBar'
import { AdminNavIcon } from './components/AdminNavIcons'

const NAV_GROUPS = [
  {
    label: 'Home',
    items: [{ to: '/admin', end: true, label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    label: 'Sales',
    items: [{ to: '/admin/orders', label: 'Orders', icon: 'orders', badgeKey: 'processingOrders' }],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/admin/products', label: 'Products', icon: 'products' },
      { to: '/admin/categories', label: 'Categories', icon: 'categories' },
      { to: '/admin/inventory', label: 'Inventory', icon: 'inventory', badgeKey: 'lowStock' },
    ],
  },
  {
    label: 'Customers',
    items: [{ to: '/admin/customers', label: 'Customers', icon: 'customers' }],
  },
  {
    label: 'Marketing',
    items: [
      { to: '/admin/merchandising', label: 'Merchandising', icon: 'merchandising' },
      { to: '/admin/reviews', label: 'Reviews', icon: 'reviews', badgeKey: 'pendingReviews' },
    ],
  },
  {
    label: 'Insights',
    items: [{ to: '/admin/analytics', label: 'Analytics', icon: 'analytics' }],
  },
  {
    label: 'Settings',
    items: [
      { to: '/admin/settings', label: 'Store settings', icon: 'settings' },
      { to: '/admin/size-charts', label: 'Size charts', icon: 'size-charts' },
    ],
  },
]

function AdminLayoutInner() {
  usePageMeta({ title: 'Admin', noIndex: true })

  const { isAdmin, logout, profile, authFetch } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [badges, setBadges] = useState({ pendingReviews: 0, lowStock: 0, processingOrders: 0 })

  const breadcrumbs = useMemo(() => {
    const path = location.pathname.replace(/\/$/, '') || '/admin'
    const crumbs = [{ label: 'Admin', to: '/admin' }]
    const map = {
      '/admin/products': 'Products',
      '/admin/products/new': 'New product',
      '/admin/orders': 'Orders',
      '/admin/categories': 'Categories',
      '/admin/inventory': 'Inventory',
      '/admin/customers': 'Customers',
      '/admin/merchandising': 'Merchandising',
      '/admin/reviews': 'Reviews',
      '/admin/analytics': 'Analytics',
      '/admin/settings': 'Settings',
      '/admin/coupons': 'Coupons',
      '/admin/size-charts': 'Size charts',
    }
    if (path === '/admin') return crumbs
    if (map[path]) {
      crumbs.push({ label: map[path] })
      return crumbs
    }
    if (path.includes('/products/') && path.endsWith('/edit')) {
      crumbs.push({ label: 'Products', to: '/admin/products' })
      crumbs.push({ label: 'Edit product' })
      return crumbs
    }
    if (path.includes('/orders/')) {
      crumbs.push({ label: 'Orders', to: '/admin/orders' })
      crumbs.push({ label: 'Order detail' })
      return crumbs
    }
    if (path.includes('/customers/')) {
      crumbs.push({ label: 'Customers', to: '/admin/customers' })
      crumbs.push({ label: 'Customer detail' })
      return crumbs
    }
    return crumbs
  }, [location.pathname])

  const loadBadges = useCallback(async () => {
    try {
      const s = await getDashboardSummary(authFetch)
      setBadges({
        pendingReviews: Number(s.pendingReviews) || 0,
        lowStock: Number(s.lowStockCount) || 0,
        processingOrders: Number(s.processingOrders) || 0,
      })
    } catch {
      setBadges({ pendingReviews: 0, lowStock: 0, processingOrders: 0 })
    }
  }, [authFetch])

  useEffect(() => {
    if (isAdmin) loadBadges()
  }, [isAdmin, loadBadges])

  if (!isAdmin) return <Navigate to="/admin/login" replace />

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const sidebar = (
    <>
      <div className="mb-5 px-2">
        <span className="font-sans text-base font-semibold tracking-[-0.01em] text-ink">Aashmika Designs</span>
        <span className="admin-eyebrow mt-0.5 block">Admin</span>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="admin-eyebrow mb-1 px-2.5 opacity-80">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, end, label, icon, badgeKey }) => {
                const badge = badgeKey ? badges[badgeKey] : 0
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`
                    }
                  >
                    <span className="admin-nav-link__icon">
                      <AdminNavIcon name={icon} />
                    </span>
                    <span className="truncate">{label}</span>
                    {badge > 0 ? (
                      <span className="admin-nav-badge">{badge > 99 ? '99+' : badge}</span>
                    ) : null}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-3 border-t border-[#e8d5c0]">
        <p className="admin-caption mb-0.5 truncate px-1">{profile?.email}</p>
        <p className="admin-caption mb-2 capitalize px-1">{profile?.role || 'admin'}</p>
        <div className="flex flex-col gap-1.5 px-1">
          <Link to="/" className="admin-caption transition hover:text-ink" target="_blank" rel="noreferrer">
            View storefront →
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="admin-caption text-left transition hover:text-[#7a2c3a]"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="admin-shell min-h-screen flex bg-[#faf7f2]">
      <aside className="hidden lg:flex w-[220px] bg-[#fffdf9] border-r border-[#e8d5c0] flex-col py-5 px-3 shrink-0 sticky top-0 h-screen print:hidden">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[240px] max-w-[85vw] h-full bg-[#fffdf9] border-r border-[#e8d5c0] flex flex-col py-5 px-3 shadow-xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-[#e8d5c0] bg-[#fffdf9] px-4 py-2.5 print:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-[#d8c4a7] px-3 py-1.5 text-xs"
          >
            Menu
          </button>
          <span className="font-sans text-sm font-semibold tracking-[-0.01em] text-ink">Admin</span>
          <Link to="/admin/products/new" className="text-xs text-[#7a2c3a] font-medium">
            + Add
          </Link>
        </header>

        <AdminTopBar profile={profile} badges={badges} />

        <main className="admin-page flex-1 overflow-auto p-4 sm:p-5 lg:p-6">
          {location.pathname.replace(/\/$/, '') !== '/admin' ? (
            <AdminBreadcrumbs items={breadcrumbs} />
          ) : null}
          <Outlet context={{ refreshBadges: loadBadges }} />
        </main>
      </div>
    </div>
  )
}

function AdminLayout() {
  return (
    <AdminToastProvider>
      <AdminLayoutInner />
    </AdminToastProvider>
  )
}

export default AdminLayout
