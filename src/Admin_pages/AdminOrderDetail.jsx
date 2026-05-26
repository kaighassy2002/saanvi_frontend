import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { getOrder, patchOrder } from './services/adminApi'
import AdminStatusBadge, { ORDER_STATUS_OPTIONS } from './components/AdminStatusBadge'
import AdminErrorBanner from './components/AdminErrorBanner'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function AdminOrderDetail() {
  const { publicId } = useParams()
  const { authFetch } = useAdminAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [status, setStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const data = await getOrder(authFetch, publicId)
      setOrder(data)
      setStatus(data.status || 'Processing')
      setTrackingNumber(data.trackingNumber || '')
      setInternalNotes(data.internalNotes || '')
    } catch (e) {
      setError(e?.message || 'Failed to load order')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [authFetch, publicId])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await patchOrder(authFetch, publicId, {
        status,
        trackingNumber: trackingNumber.trim(),
        internalNotes: internalNotes.trim(),
      })
      setOrder(updated)
      setSuccess('Order updated.')
    } catch (err) {
      setError(err?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted text-sm">Loading…</p>
  if (!order && !loading) {
    return (
      <div>
        <Link to="/admin/orders" className="text-sm text-muted hover:text-ink">
          ← Back to orders
        </Link>
        <p className="mt-4 text-muted">Order not found.</p>
      </div>
    )
  }

  const shipping = order.shipping || {}
  const items = Array.isArray(order.items) ? order.items : []
  const inputClass =
    'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

  return (
    <div className="max-w-3xl">
      <Link to="/admin/orders" className="text-sm text-muted hover:text-ink">
        ← Back to orders
      </Link>

      <div className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-bodoni text-2xl text-ink">Order {order.id}</h1>
          <p className="text-sm text-muted mt-1">{order.date}</p>
        </div>
        <AdminStatusBadge status={order.status} />
      </div>

      <AdminErrorBanner message={error} onRetry={load} />
      {success ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="lux-card p-5 space-y-3">
          <h2 className="font-playfair text-sm text-ink">Customer</h2>
          <p className="text-sm">{order.customerName || '—'}</p>
          <p className="text-sm text-muted">{order.customerEmail || '—'}</p>
          <p className="text-sm text-muted">Payment: {order.paymentMethod || '—'}</p>
          <p className="text-lg font-medium text-ink">Total: {formatPrice(order.total)}</p>
        </section>

        <section className="lux-card p-5 space-y-2">
          <h2 className="font-playfair text-sm text-ink">Shipping address</h2>
          <p className="text-sm">
            {[shipping.firstName, shipping.lastName].filter(Boolean).join(' ') || '—'}
          </p>
          <p className="text-sm text-muted">{shipping.address || shipping.line1 || ''}</p>
          <p className="text-sm text-muted">
            {[shipping.city, shipping.state, shipping.pincode || shipping.zip]
              .filter(Boolean)
              .join(', ')}
          </p>
          <p className="text-sm text-muted">{shipping.phone || ''}</p>
        </section>
      </div>

      <section className="lux-card p-5 mt-6">
        <h2 className="font-playfair text-sm text-ink mb-3">Line items</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted">No items recorded.</p>
        ) : (
          <ul className="divide-y divide-[#f0e6d6]">
            {items.map((item, i) => (
              <li key={i} className="flex justify-between py-2 text-sm">
                <span>
                  {item.name || item.title || 'Item'} × {item.quantity || 1}
                </span>
                <span>{formatPrice(item.price * (item.quantity || 1) || item.lineTotal)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={handleSave} className="lux-card p-5 mt-6 space-y-4">
        <h2 className="font-playfair text-sm text-ink">Fulfillment</h2>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Status</label>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {ORDER_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            {status && !ORDER_STATUS_OPTIONS.includes(status) ? (
              <option value={status}>{status}</option>
            ) : null}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Tracking number</label>
          <input
            className={inputClass}
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Internal notes</label>
          <textarea
            rows={3}
            className={inputClass}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
          />
        </div>
        <button type="submit" disabled={saving} className="lux-button px-4 py-2 text-sm">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

export default AdminOrderDetail
