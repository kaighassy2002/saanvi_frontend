import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminFetchOrderById, adminUpdateOrder } from '../services/orderService'
import { ORDER_STATUSES } from '../services/localOrders'

export default function AdminOrderDetail() {
  const { orderId } = useParams()
  const decodedId = orderId ? decodeURIComponent(orderId) : ''

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [status, setStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const o = await adminFetchOrderById(decodedId)
        if (!cancelled && o) {
          setOrder(o)
          setStatus(o.status || '')
          setTrackingNumber(o.trackingNumber || '')
          setInternalNotes(o.internalNotes || '')
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load order')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [decodedId])

  async function handleSave(e) {
    e.preventDefault()
    if (!order) return
    setSaving(true)
    setError('')
    try {
      const updated = await adminUpdateOrder(order.id, {
        status,
        trackingNumber,
        internalNotes,
      })
      setOrder(updated)
    } catch (err) {
      setError(err?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="font-playfair text-muted">Loading order…</p>
  if (!order) {
    return (
      <div className="space-y-4">
        <p className="font-playfair text-muted">Order not found.</p>
        <Link to="/admin/orders" className="text-[#7a2c3a] hover:underline">
          ← Back to orders
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/admin/orders" className="font-playfair text-sm text-muted hover:text-[#7a2c3a]">
          ← Orders
        </Link>
        <h2 className="font-bodoni text-3xl text-ink">{order.id}</h2>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-2 font-playfair text-sm text-red-800">{error}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lux-card space-y-4 p-6">
          <h3 className="card-title">Line items</h3>
          <ul className="space-y-3 font-playfair text-sm">
            {order.items?.map((item, i) => (
              <li key={i} className="flex gap-3 border-b border-[#eadfc9] pb-3 last:border-0">
                <img
                  src={item.image}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-muted">
                    Qty {item.quantity} × ₹{Number(item.price).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="card-title pt-2 text-right">
            Total ₹{Number(order.total).toLocaleString()}
          </p>
        </div>

        <div className="lux-card space-y-4 p-6">
          <h3 className="card-title">Shipping</h3>
          {order.shipping ? (
            <div className="space-y-1 font-playfair text-sm text-muted">
              <p className="text-ink">
                {order.shipping.firstName} {order.shipping.lastName}
              </p>
              <p>{order.shipping.address}</p>
              <p>
                {order.shipping.city}, {order.shipping.state} {order.shipping.pincode}
              </p>
              <p>{order.shipping.phone}</p>
              <p>{order.shipping.email}</p>
            </div>
          ) : (
            <p className="text-muted">No shipping data</p>
          )}
          <p className="font-playfair text-sm">
            <span className="text-muted">Payment: </span>
            {order.paymentMethod || '—'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="lux-card space-y-5 p-6 sm:p-8">
        <h3 className="card-title">Fulfilment</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label">Status</label>
            <select
              className="royal-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Tracking number</label>
            <input
              className="royal-input"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <div>
          <label className="form-label">Internal notes</label>
          <textarea
            className="royal-input min-h-[88px] resize-y"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={3}
          />
        </div>
        <button type="submit" disabled={saving} className="lux-button">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
