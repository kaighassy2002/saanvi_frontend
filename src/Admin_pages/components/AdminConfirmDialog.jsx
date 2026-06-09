import React from 'react'

function AdminConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, busy }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#e8d5c0] bg-white p-6 shadow-lg">
        <h2 className="admin-section-title">{title}</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-[#d8c4a7] px-4 py-2 text-sm hover:bg-[#faf7f2]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-800 disabled:opacity-60"
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminConfirmDialog
