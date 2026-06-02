import React from 'react'
import { Link } from 'react-router-dom'

export default function AdminBreadcrumbs({ items = [] }) {
  if (!items.length) return null
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 ? <span className="text-[#d8c4a7]">/</span> : null}
          {item.to ? (
            <Link to={item.to} className="hover:text-ink transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
