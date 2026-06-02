import React from 'react'

export default function AdminPagination({ page, pages, total, onPageChange }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-[#f0e6d6] px-4 py-3 text-xs text-muted">
      <span>{total} total</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded border border-[#d8c4a7] px-2 py-1 disabled:opacity-40 hover:bg-[#faf7f2]"
        >
          Prev
        </button>
        <span>
          Page {page} of {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="rounded border border-[#d8c4a7] px-2 py-1 disabled:opacity-40 hover:bg-[#faf7f2]"
        >
          Next
        </button>
      </div>
    </div>
  )
}
