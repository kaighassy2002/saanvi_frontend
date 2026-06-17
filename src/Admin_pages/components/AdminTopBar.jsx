import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function AdminTopBar({ profile, badges = {} }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const orderCount = Number(badges.processingOrders) || 0
  const reminderCount =
    (Number(badges.pendingReviews) || 0) + (Number(badges.lowStock) || 0)

  const handleSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    navigate(`/admin/orders?q=${encodeURIComponent(q)}`)
  }

  const displayName = profile?.name || profile?.email?.split('@')[0] || 'Admin'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <header className="admin-topbar print:hidden">
      <form onSubmit={handleSearch} className="admin-topbar-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search orders, customers…"
          className="admin-topbar-search__input"
        />
      </form>

      <div className="admin-topbar-actions">
        <Link to="/admin/orders" className="admin-topbar-icon-btn" title="Orders" aria-label="Orders">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M6 6h15l-1.5 9H7.5L6 6z" />
            <path d="M6 6 5 3H2" />
            <circle cx="9" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </svg>
          {orderCount > 0 ? (
            <span className="admin-topbar-icon-btn__badge">{orderCount > 9 ? '9+' : orderCount}</span>
          ) : null}
        </Link>

        <Link
          to="/admin/reviews?status=pending"
          className="admin-topbar-icon-btn"
          title="Reminders"
          aria-label="Reminders"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
            <path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
          {reminderCount > 0 ? (
            <span className="admin-topbar-icon-btn__badge">{reminderCount > 9 ? '9+' : reminderCount}</span>
          ) : null}
        </Link>

        <div className="admin-topbar-profile">
          <span className="admin-topbar-profile__avatar" aria-hidden>
            {initial}
          </span>
          <div className="hidden sm:block min-w-0">
            <p className="admin-topbar-profile__name truncate">{displayName}</p>
            <p className="admin-topbar-profile__role capitalize">{profile?.role || 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminTopBar
