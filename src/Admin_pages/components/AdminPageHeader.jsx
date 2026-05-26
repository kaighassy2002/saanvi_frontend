import React from 'react'
import { Link } from 'react-router-dom'

function AdminPageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-bodoni text-2xl text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action ? (
        action.to ? (
          <Link to={action.to} className="lux-button px-4 py-2 text-sm">
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className="lux-button px-4 py-2 text-sm">
            {action.label}
          </button>
        )
      ) : null}
    </div>
  )
}

export default AdminPageHeader
