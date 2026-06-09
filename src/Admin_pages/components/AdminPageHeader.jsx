import React from 'react'
import { Link } from 'react-router-dom'

function AdminPageHeader({ title, description, action, children }) {
  const actionNode = children || (action ? (
    action.to ? (
      <Link to={action.to} className="lux-button px-4 py-2 text-sm">
        {action.label}
      </Link>
    ) : (
      <button type="button" onClick={action.onClick} className="lux-button px-4 py-2 text-sm">
        {action.label}
      </button>
    )
  ) : null)

  return (
    <header className="admin-page-header">
      <div className="min-w-0">
        <h1 className="admin-page-title">{title}</h1>
        {description ? <p className="admin-page-lead">{description}</p> : null}
      </div>
      {actionNode ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actionNode}</div> : null}
    </header>
  )
}

export default AdminPageHeader
