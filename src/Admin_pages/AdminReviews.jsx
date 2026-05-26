import React, { useCallback, useEffect, useState } from 'react'
import { adminDeleteReview, adminFetchReviews, adminPatchReview } from '../services/reviewService'

const STATUS_OPTIONS = ['pending', 'approved', 'rejected']

function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const data = await adminFetchReviews()
      setReviews(Array.isArray(data?.reviews) ? data.reviews : [])
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

  const setStatus = async (id, status) => {
    setBusyId(id)
    try {
      await adminPatchReview(id, status)
      await load()
    } catch (e) {
      setError(e?.message || 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return
    setBusyId(id)
    try {
      await adminDeleteReview(id)
      await load()
    } catch (e) {
      setError(e?.message || 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  const pendingCount = reviews.filter((r) => r.status === 'pending').length

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-bodoni text-2xl text-ink">Reviews</h1>
          <p className="mt-1 text-sm text-muted">
            Moderate customer reviews before they appear on the storefront.
          </p>
        </div>
        {pendingCount > 0 ? (
          <span className="rounded-full bg-[#fff6eb] px-3 py-1 font-playfair text-sm text-[#9a3412]">
            {pendingCount} pending
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted">No reviews yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e8d5c0] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[#e8d5c0] bg-[#faf7f2] font-playfair text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-b border-[#f0e6d6] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{r.productId}</td>
                  <td className="px-4 py-3">{r.customerName || '—'}</td>
                  <td className="px-4 py-3">{r.rating}/5</td>
                  <td className="max-w-xs px-4 py-3">
                    {r.title ? <p className="font-medium text-ink">{r.title}</p> : null}
                    <p className="line-clamp-2 text-muted">{r.body}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{r.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.filter((s) => s !== r.status).map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => setStatus(r.id, status)}
                          className="rounded-lg border border-[#d8c4a7] px-2 py-1 text-xs capitalize hover:bg-[#f7ecee]"
                        >
                          {status}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => remove(r.id)}
                        className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
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
    </div>
  )
}

export default AdminReviews
