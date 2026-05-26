import React from 'react'

function AdminErrorBanner({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
      <span>{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-red-200 px-3 py-1 text-xs hover:bg-red-100"
        >
          Retry
        </button>
      ) : null}
    </div>
  )
}

export default AdminErrorBanner
