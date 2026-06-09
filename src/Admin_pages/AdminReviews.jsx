import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  adminBulkReviews,
  adminDeleteReview,
  adminFetchReviews,
  adminPatchReview,
} from '../services/reviewService'
import AdminConfirmDialog from './components/AdminConfirmDialog'
import { useAdminToast } from './shared/AdminToastProvider'

const STATUS_OPTIONS = ['all', 'pending', 'approved', 'rejected']

function AdminReviews() {
  const { toast } = useAdminToast()
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || 'all'
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [statusFilter, setStatusFilter] = useState(
    STATUS_OPTIONS.includes(initialStatus) ? initialStatus : 'all'
  )
  const [selected, setSelected] = useState(new Set())
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const data = await adminFetchReviews()
      setReviews(Array.isArray(data?.reviews) ? data.reviews : [])
      setSelected(new Set())
    } catch (e) {
      setError(e?.message || 'Failed to load reviews')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return reviews
    return reviews.filter((r) => r.status === statusFilter)
  }, [reviews, statusFilter])

  const pendingCount = reviews.filter((r) => r.status === 'pending').length

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((r) => r.id)))
    }
  }

  const setStatus = async (id, status) => {
    setBusyId(id)
    try {
      await adminPatchReview(id, status)
      await load()
      toast(`Review ${status}.`)
    } catch (e) {
      setError(e?.message || 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  const bulkSetStatus = async (status) => {
    const ids = [...selected]
    if (!ids.length) return
    setBusyId('bulk')
    try {
      await adminBulkReviews(ids, status)
      await load()
      toast(`${ids.length} review(s) ${status}.`)
    } catch (e) {
      setError(e?.message || 'Bulk update failed')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    try {
      await adminDeleteReview(deleteTarget.id)
      setDeleteTarget(null)
      await load()
      toast('Review deleted.')
    } catch (e) {
      setError(e?.message || 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Reviews</h1>
          <p className="admin-page-lead">
            Moderate customer reviews before they appear on the storefront.
          </p>
        </div>
        {pendingCount > 0 ? (
          <span className="admin-body rounded-full bg-[#fff6eb] px-3 py-1 font-medium text-[#9a3412]">
            {pendingCount} pending
          </span>
        ) : null}
      </header>

      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs capitalize ${
              statusFilter === s ? 'bg-[#f4e8db] font-medium' : 'border border-[#e8d5c0]'
            }`}
          >
            {s}
          </button>
        ))}
        {selected.size > 0 ? (
          <>
            <span className="text-xs text-muted ml-2">{selected.size} selected</span>
            <button
              type="button"
              disabled={busyId === 'bulk'}
              onClick={() => bulkSetStatus('approved')}
              className="rounded-lg border border-[#e8d5c0] px-3 py-1 text-xs"
            >
              Approve all
            </button>
            <button
              type="button"
              disabled={busyId === 'bulk'}
              onClick={() => bulkSetStatus('rejected')}
              className="rounded-lg border border-[#e8d5c0] px-3 py-1 text-xs"
            >
              Reject all
            </button>
          </>
        ) : null}
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted">No reviews in this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e8d5c0] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[#e8d5c0] bg-[#faf7f2]">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="admin-table-head px-4 py-3">Product</th>
                <th className="admin-table-head px-4 py-3">Customer</th>
                <th className="admin-table-head px-4 py-3">Rating</th>
                <th className="admin-table-head px-4 py-3">Review</th>
                <th className="admin-table-head px-4 py-3">Status</th>
                <th className="admin-table-head px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[#f0e6d6] last:border-0">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      aria-label={`Select review ${r.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.productId}</td>
                  <td className="px-4 py-3">{r.customerName || '—'}</td>
                  <td className="px-4 py-3">{r.rating}/5</td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-muted text-xs line-clamp-2">{r.body}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{r.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.status !== 'approved' ? (
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => setStatus(r.id, 'approved')}
                          className="rounded border border-[#d8c4a7] px-2 py-0.5 text-xs"
                        >
                          Approve
                        </button>
                      ) : null}
                      {r.status !== 'rejected' ? (
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => setStatus(r.id, 'rejected')}
                          className="rounded border border-[#d8c4a7] px-2 py-0.5 text-xs"
                        >
                          Reject
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => setDeleteTarget(r)}
                        className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete review"
        message="Delete this review permanently?"
        confirmLabel="Delete"
        busy={!!busyId}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default AdminReviews
