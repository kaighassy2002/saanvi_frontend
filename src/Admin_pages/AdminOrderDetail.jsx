import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  confirmCodOrder,
  downloadOrderInvoice,
  generateCourierAwb,
  getAdminSettings,
  getCourierStatus,
  getOrder,
  patchOrder,
  processOrderRefund,
  rmaOrderAction,
} from './services/adminApi'
import { useAdminToast } from './shared/AdminToastProvider'
import AdminStatusBadge, { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from './components/AdminStatusBadge'
import AdminErrorBanner from './components/AdminErrorBanner'
import PackingSlipPrint from './components/PackingSlipPrint'

const STATUS_FLOW = [
  'Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
]
const QUICK_ACTIONS = [
  { label: 'Confirm order', status: 'Confirmed' },
  { label: 'Mark packed', status: 'Packed' },
  { label: 'Mark shipped', status: 'Shipped' },
  { label: 'Out for delivery', status: 'Out For Delivery' },
  { label: 'Mark delivered', status: 'Delivered' },
  { label: 'Cancel order', status: 'Cancelled' },
]

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function formatDateTime(raw) {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw)
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function paymentMethodLabel(method) {
  const key = String(method || '').toLowerCase()
  if (key === 'razorpay') return 'Online (Razorpay)'
  if (key === 'cod') return 'Cash on Delivery'
  return method || '—'
}

function lineTotal(item) {
  const qty = Number(item.quantity || item.qty || 1)
  if (item.lineTotal != null) return Number(item.lineTotal)
  return (Number(item.price) || 0) * qty
}

function flowIndex(status) {
  const legacy = {
    Pending: 'Placed',
    Processing: 'Packed',
    Paid: 'Confirmed',
    'In Transit': 'Shipped',
  }
  const s = legacy[status] || String(status || 'Placed')
  if (s === 'Cancelled' || s === 'Returned' || s === 'Return Requested') return -1
  const idx = STATUS_FLOW.indexOf(s)
  return idx >= 0 ? idx : 0
}

function PaymentBadge({ status }) {
  const key = String(status || 'pending').toLowerCase()
  const styles = {
    paid: 'bg-[#f0f4ee] text-[#5a6b52]',
    pending: 'bg-[#fff6eb] text-[#9f7a2c]',
    failed: 'bg-[#f7ecee] text-[#7a2c3a]',
    refunded: 'bg-[#f8f1e6] text-[#6f5d5b]',
    partially_refunded: 'bg-[#f8f1e6] text-[#9f7a2c]',
  }
  const label = key === 'partially_refunded' ? 'Partially refunded' : status || 'pending'
  return (
    <span className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-medium capitalize ${styles[key] || styles.pending}`}>
      {label}
    </span>
  )
}

function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`admin-panel ${className}`}>
      {(title || action) && (
        <div className="admin-panel-header">
          {title ? <h2 className="admin-panel-title">{title}</h2> : <span />}
          {action || null}
        </div>
      )}
      {children}
    </section>
  )
}

function CopyButton({ text, label }) {
  const { toast } = useAdminToast()
  return (
    <button
      type="button"
      className="admin-order-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          toast(`${label} copied.`)
        } catch {
          toast('Copy failed', 'error')
        }
      }}
    >
      Copy
    </button>
  )
}

function StatusStepper({ status }) {
  const current = flowIndex(status)
  const cancelled = String(status) === 'Cancelled'

  if (cancelled) {
    return (
      <div className="admin-order-stepper admin-order-stepper--cancelled">
        <span className="admin-order-stepper__badge">Order cancelled</span>
      </div>
    )
  }

  return (
    <div className="admin-order-stepper">
      {STATUS_FLOW.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={step} className="admin-order-stepper__step">
            <div
              className={`admin-order-stepper__dot ${done ? 'admin-order-stepper__dot--done' : ''} ${active ? 'admin-order-stepper__dot--active' : ''}`}
            >
              {done ? '✓' : i + 1}
            </div>
            <span className={`admin-order-stepper__label ${active ? 'admin-order-stepper__label--active' : ''}`}>
              {step}
            </span>
            {i < STATUS_FLOW.length - 1 ? <div className={`admin-order-stepper__line ${done ? 'admin-order-stepper__line--done' : ''}`} /> : null}
          </div>
        )
      })}
    </div>
  )
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse print:hidden">
      <div className="h-4 w-32 rounded bg-[#f4e8db]" />
      <div className="h-28 rounded-xl bg-[#f4e8db]" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="h-[420px] rounded-xl bg-[#f4e8db] lg:col-span-8" />
        <div className="h-[420px] rounded-xl bg-[#f4e8db] lg:col-span-4" />
      </div>
    </div>
  )
}

function AdminOrderDetail() {
  const { publicId } = useParams()
  const { authFetch } = useAdminAuth()
  const { toast } = useAdminToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courierPartner, setCourierPartner] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [courierStatus, setCourierStatus] = useState({ shiprocket: false, delhivery: false })
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundNote, setRefundNote] = useState('')
  const [codConfirmThreshold, setCodConfirmThreshold] = useState(10000)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const data = await getOrder(authFetch, publicId)
      setOrder(data)
      setStatus(data.status || 'Placed')
      setPaymentStatus(data.paymentStatus || 'pending')
      setTrackingNumber(data.trackingNumber || '')
      setCourierPartner(data.courierPartner || '')
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

  useEffect(() => {
    getCourierStatus(authFetch)
      .then(setCourierStatus)
      .catch(() => setCourierStatus({ shiprocket: false, delhivery: false }))
    getAdminSettings(authFetch)
      .then((s) => setCodConfirmThreshold(Number(s.codConfirmThreshold) || 10000))
      .catch(() => {})
  }, [authFetch])

  const hasChanges =
    order &&
    (status !== (order.status || 'Placed') ||
      paymentStatus !== (order.paymentStatus || 'pending') ||
      trackingNumber !== (order.trackingNumber || '') ||
      courierPartner !== (order.courierPartner || '') ||
      internalNotes !== (order.internalNotes || ''))

  const saveOrder = async (overrides = {}) => {
    setSaving(true)
    setError('')
    try {
      const body = {
        status: overrides.status ?? status,
        paymentStatus: overrides.paymentStatus ?? paymentStatus,
        trackingNumber: (overrides.trackingNumber ?? trackingNumber).trim(),
        courierPartner: (overrides.courierPartner ?? courierPartner).trim(),
        internalNotes: (overrides.internalNotes ?? internalNotes).trim(),
        note: overrides.note,
      }
      const updated = await patchOrder(authFetch, publicId, body)
      setOrder(updated)
      setStatus(updated.status || body.status)
      setPaymentStatus(updated.paymentStatus || body.paymentStatus)
      setTrackingNumber(updated.trackingNumber || '')
      setCourierPartner(updated.courierPartner || '')
      setInternalNotes(updated.internalNotes || '')
      toast('Order updated.')
      return updated
    } catch (err) {
      setError(err?.message || 'Update failed')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    await saveOrder()
  }

  const handleQuickAction = async (nextStatus, extras = {}) => {
    setStatus(nextStatus)
    try {
      const updated = await saveOrder({ status: nextStatus, ...extras })
      setOrder(updated)
    } catch {
      setStatus(order?.status || 'Placed')
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      const blob = await downloadOrderInvoice(publicId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${order?.invoiceNumber || publicId.replace('ORD-', 'INV-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast('GST invoice downloaded.')
    } catch (e) {
      toast(e?.message || 'Invoice download failed', 'error')
    }
  }

  const handleConfirmCod = async () => {
    setSaving(true)
    try {
      const updated = await confirmCodOrder(authFetch, publicId, 'COD verified by admin')
      setOrder(updated)
      toast('COD order confirmed — safe to pack.')
    } catch (e) {
      toast(e?.message || 'COD confirmation failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateAwb = async (partner) => {
    setSaving(true)
    try {
      const updated = await generateCourierAwb(authFetch, publicId, partner)
      setOrder(updated)
      setTrackingNumber(updated.trackingNumber || '')
      setCourierPartner(updated.courierPartner || '')
      toast(`AWB generated: ${updated.trackingNumber || 'see courier panel'}`)
    } catch (e) {
      toast(e?.message || 'AWB generation failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRmaStep = async (step) => {
    setSaving(true)
    try {
      const updated = await rmaOrderAction(authFetch, publicId, step)
      setOrder(updated)
      setStatus(updated.status || status)
      setPaymentStatus(updated.paymentStatus || paymentStatus)
      toast(`RMA: ${step} completed.`)
    } catch (e) {
      toast(e?.message || 'RMA step failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRefund = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await processOrderRefund(authFetch, publicId, {
        amount: refundAmount ? Number(refundAmount) : undefined,
        reason: refundReason,
        note: refundNote,
      })
      setOrder(updated)
      setPaymentStatus(updated.paymentStatus || paymentStatus)
      setRefundOpen(false)
      setRefundAmount('')
      setRefundReason('')
      setRefundNote('')
      toast('Refund processed.')
    } catch (err) {
      toast(err?.message || 'Refund failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <OrderDetailSkeleton />

  if (!order) {
    return (
      <div className="print:hidden">
        <Link to="/admin/orders" className="admin-order-back">
          ← Back to orders
        </Link>
        <AdminErrorBanner message={error || 'Order not found.'} onRetry={load} />
      </div>
    )
  }

  const shipping = order.shipping || {}
  const items = Array.isArray(order.items) ? order.items : []
  const statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : []
  const payments = Array.isArray(order.payments) ? order.payments : []
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || item.qty || 1), 0)
  const computedSubtotal = items.reduce((sum, item) => sum + lineTotal(item), 0)
  const subtotal = order.subtotal != null ? Number(order.subtotal) : computedSubtotal
  const shippingFee = Number(order.shippingFee) || 0
  const total = Number(order.total) || subtotal + shippingFee

  const timeline = [...statusHistory]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 12)

  const inputClass = 'royal-input text-sm py-2'
  const recipientName =
    [shipping.firstName, shipping.lastName].filter(Boolean).join(' ') || order.customerName || '—'
  const isCod = String(order.paymentMethod || '').toLowerCase() === 'cod'
  const codThreshold = codConfirmThreshold
  const needsCodConfirm = isCod && !order.codConfirmedAt && total >= codThreshold
  const refunds = Array.isArray(order.refunds) ? order.refunds : []
  const refundedTotal = refunds.reduce((s, r) => s + Number(r.amount || 0), 0)
  const maxRefund = Math.max(0, total - refundedTotal)
  const trackingLink =
    order.trackingUrl ||
    (order.courierPartner?.toLowerCase().includes('delhivery') && order.trackingNumber
      ? `https://www.delhivery.com/track/package/${order.trackingNumber}`
      : order.trackingNumber
        ? `https://shiprocket.co/tracking/${order.trackingNumber}`
        : '')

  return (
    <>
      <PackingSlipPrint order={order} shipping={shipping} items={items} />

      <div className="print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link to="/admin/orders" className="admin-order-back">
            ← Orders
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={order.id} label="Order ID" />
            {order.customerEmail ? (
              <a href={`mailto:${order.customerEmail}`} className="admin-view-all">
                Email customer
              </a>
            ) : null}
            <button type="button" onClick={() => window.print()} className="admin-view-all">
              Print slip
            </button>
            <button type="button" onClick={handleDownloadInvoice} className="admin-view-all">
              GST invoice PDF
            </button>
          </div>
        </div>

        {needsCodConfirm ? (
          <div className="mb-4 rounded-lg border border-[#e8c87a] bg-[#fff6eb] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#9f7a2c]">High-value COD — verify before packing</p>
              <p className="text-xs text-muted mt-0.5">
                Confirm customer phone and address to reduce RTO risk.
              </p>
            </div>
            <button type="button" disabled={saving} onClick={handleConfirmCod} className="lux-button rounded-lg px-4 py-2 text-xs">
              Confirm COD order
            </button>
          </div>
        ) : null}

        {order.rmaId ? (
          <div className="mb-4 rounded-lg border border-[#e8d5c0] bg-white px-4 py-3">
            <p className="text-sm font-medium text-ink">
              RMA {order.rmaId}
              {order.rmaStatus ? (
                <span className="ml-2 text-xs font-normal text-muted capitalize">· {order.rmaStatus}</span>
              ) : null}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {order.rmaStatus === 'requested' ? (
                <button type="button" disabled={saving} onClick={() => handleRmaStep('receive')} className="admin-quick-action text-xs">
                  Mark received
                </button>
              ) : null}
              {order.rmaStatus === 'received' ? (
                <button type="button" disabled={saving} onClick={() => handleRmaStep('restock')} className="admin-quick-action text-xs">
                  Restock items
                </button>
              ) : null}
              {['restocked', 'received', 'requested'].includes(order.rmaStatus) &&
              order.paymentStatus !== 'refunded' ? (
                <button type="button" disabled={saving} onClick={() => setRefundOpen(true)} className="admin-quick-action text-xs">
                  Process refund
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <section className="admin-order-hero mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Order detail</p>
              <h1 className="font-bodoni text-2xl text-ink mt-1">{order.id}</h1>
              <p className="text-sm text-muted mt-1">
                {formatDateTime(order.placedAt || order.date || order.createdAt)}
              </p>
              {order.cancellationRequestedAt ? (
                <p className="text-xs text-[#9b1c1c] mt-1">Customer requested cancellation</p>
              ) : null}
              {order.returnRequestedAt ? (
                <p className="text-xs text-[#9f7a2c] mt-1">Customer requested return</p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="font-sans text-2xl font-semibold text-[#9f7a2c] tabular-nums">{formatPrice(total)}</p>
              <p className="text-xs text-muted mt-0.5">
                {itemCount} item{itemCount === 1 ? '' : 's'} · {paymentMethodLabel(order.paymentMethod)}
              </p>
              <div className="flex flex-wrap justify-end gap-2 mt-2">
                <AdminStatusBadge status={order.status} />
                <PaymentBadge status={order.paymentStatus} />
              </div>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-[#f0e6d6]">
            <StatusStepper status={order.status} />
          </div>
        </section>

        <AdminErrorBanner message={error} onRetry={load} />

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            <Panel title={`Items (${itemCount})`}>
              {items.length === 0 ? (
                <p className="text-sm text-muted">No items recorded.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item, i) => {
                    const qty = Number(item.quantity || item.qty || 1)
                    const totalLine = lineTotal(item)
                    const unit = qty > 0 ? totalLine / qty : totalLine
                    const productId = item.productId || item.id
                    return (
                      <div key={i} className="admin-order-line">
                        <span className="admin-product-row__thumb h-14 w-14 shrink-0">
                          {item.image ? (
                            <img src={item.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-muted">—</span>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          {productId ? (
                            <Link
                              to={`/admin/products/${encodeURIComponent(productId)}/edit`}
                              className="text-sm font-medium text-ink hover:text-[#9f7a2c] hover:underline truncate block"
                            >
                              {item.name || item.title || 'Item'}
                            </Link>
                          ) : (
                            <p className="text-sm font-medium text-ink truncate">{item.name || item.title || 'Item'}</p>
                          )}
                          {(item.variantName || item.sku) && (
                            <p className="text-xs text-muted truncate">
                              {[item.variantName, item.sku].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          <p className="text-xs text-muted mt-0.5">
                            {formatPrice(unit)} × {qty}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums text-ink shrink-0">{formatPrice(totalLine)}</p>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="mt-5 rounded-lg bg-[#faf7f2] border border-[#efe2d1] p-4 space-y-2 max-w-sm ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Shipping</span>
                  <span className="tabular-nums">{shippingFee ? formatPrice(shippingFee) : 'Free'}</span>
                </div>
                <div className="flex justify-between text-base font-semibold border-t border-[#e8d5c0] pt-2">
                  <span>Total paid</span>
                  <span className="tabular-nums text-[#9f7a2c]">{formatPrice(total)}</span>
                </div>
              </div>
            </Panel>

            {refunds.length > 0 ? (
              <Panel title="Refunds">
                <div className="space-y-2">
                  {refunds.map((r, i) => (
                    <div key={i} className="admin-order-payment-card text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold tabular-nums">{formatPrice(r.amount)}</span>
                        <span className="text-xs text-muted capitalize">{r.status || 'processed'}</span>
                      </div>
                      <p className="text-xs text-muted mt-1">{formatDateTime(r.at)} · {r.by || 'admin'}</p>
                      {r.reason ? <p className="text-xs mt-0.5">{r.reason}</p> : null}
                      {r.razorpayRefundId ? (
                        <p className="text-[10px] text-muted break-all">Razorpay: {r.razorpayRefundId}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {payments.length > 0 ? (
              <Panel title="Payments">
                <div className="grid gap-3 sm:grid-cols-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="admin-order-payment-card">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-ink truncate">{payment.id}</span>
                        <PaymentBadge status={payment.status} />
                      </div>
                      <p className="text-lg font-semibold tabular-nums text-ink">{formatPrice(payment.amount)}</p>
                      <p className="text-xs text-muted mt-1">
                        {payment.provider || '—'}
                        {payment.instrument ? ` · ${String(payment.instrument).toUpperCase()}` : ''}
                      </p>
                      {payment.razorpayPaymentId ? (
                        <p className="text-[10px] text-muted break-all mt-2">Razorpay: {payment.razorpayPaymentId}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            <Panel title="Activity">
              <ol className="admin-order-timeline">
                {timeline.map((entry, i) => (
                  <li key={i} className="admin-order-timeline__item">
                    <div className={`admin-order-timeline__dot ${i === 0 ? 'admin-order-timeline__dot--first' : ''}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-ink">{entry.status}</p>
                        {entry.paymentStatus && i > 0 ? (
                          <PaymentBadge status={entry.paymentStatus} />
                        ) : null}
                      </div>
                      <p className="text-xs text-muted">{formatDateTime(entry.at)}</p>
                      {entry.note ? <p className="text-xs text-muted mt-0.5">{entry.note}</p> : null}
                      {entry.by ? <p className="text-[10px] text-muted mt-0.5">Updated by {entry.by}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>

          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4 lg:self-start">
            <Panel title="Customer & delivery">
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Customer</p>
                  <p className="text-sm font-medium text-ink">{order.customerName || '—'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-muted break-all">{order.customerEmail || '—'}</p>
                    {order.customerEmail ? <CopyButton text={order.customerEmail} label="Email" /> : null}
                  </div>
                  {order.customerUserId ? (
                    <Link
                      to={`/admin/customers/${encodeURIComponent(order.customerUserId)}`}
                      className="admin-panel-link inline-block mt-2"
                    >
                      View profile →
                    </Link>
                  ) : null}
                </div>
                <div className="border-t border-[#f0e6d6] pt-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Ship to</p>
                  <p className="text-sm font-medium text-ink">{recipientName}</p>
                  <p className="text-sm text-muted mt-1 leading-relaxed">
                    {[shipping.address || shipping.line1, shipping.city, shipping.state, shipping.pincode || shipping.zip]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                  {shipping.phone ? (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm text-muted">{shipping.phone}</p>
                      <CopyButton text={shipping.phone} label="Phone" />
                    </div>
                  ) : null}
                </div>
              </div>
            </Panel>

            <Panel title="Fulfillment">
              <div className="mb-4 flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    disabled={saving || order.status === action.status}
                    onClick={() => handleQuickAction(action.status)}
                    className="admin-quick-action disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
                {order.status === 'Return Requested' ? (
                  <>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleQuickAction('Returned', { note: 'Return approved' })}
                      className="admin-quick-action disabled:opacity-50"
                    >
                      Approve return
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        handleQuickAction('Delivered', { note: 'Return request rejected' })
                      }
                      className="admin-quick-action disabled:opacity-50"
                    >
                      Reject return
                    </button>
                  </>
                ) : null}
                {order.status === 'Returned' && order.paymentStatus !== 'refunded' ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setRefundOpen(true)}
                    className="admin-quick-action disabled:opacity-50"
                  >
                    Process refund
                  </button>
                ) : null}
              </div>

              <div className="mb-4 rounded-lg border border-[#efe2d1] bg-[#faf7f2] p-3 space-y-2">
                <p className="text-xs font-medium text-ink">Courier integration</p>
                <div className="flex flex-wrap gap-2">
                  {courierStatus.shiprocket ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleGenerateAwb('shiprocket')}
                      className="admin-quick-action text-xs"
                    >
                      Shiprocket AWB
                    </button>
                  ) : null}
                  {courierStatus.delhivery ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleGenerateAwb('delhivery')}
                      className="admin-quick-action text-xs"
                    >
                      Delhivery AWB
                    </button>
                  ) : null}
                  {!courierStatus.shiprocket && !courierStatus.delhivery ? (
                    <p className="text-xs text-muted">Set SHIPROCKET_* or DELHIVERY_* in server .env for AWB generation.</p>
                  ) : null}
                </div>
                {trackingLink ? (
                  <a href={trackingLink} target="_blank" rel="noreferrer" className="admin-panel-link text-xs">
                    Track shipment →
                  </a>
                ) : null}
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="form-label text-xs" htmlFor="order-status">
                    Order status
                  </label>
                  <select id="order-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
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
                  <label className="form-label text-xs" htmlFor="payment-status">
                    Payment status
                  </label>
                  <select
                    id="payment-status"
                    className={inputClass}
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  >
                    {PAYMENT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label text-xs" htmlFor="courier">
                    Courier partner
                  </label>
                  <input
                    id="courier"
                    className={inputClass}
                    value={courierPartner}
                    onChange={(e) => setCourierPartner(e.target.value)}
                    placeholder="e.g. Delhivery, Blue Dart"
                  />
                </div>

                <div>
                  <label className="form-label text-xs" htmlFor="tracking">
                    Tracking number
                  </label>
                  <input
                    id="tracking"
                    className={inputClass}
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Courier tracking ID"
                  />
                </div>

                <div>
                  <label className="form-label text-xs" htmlFor="notes">
                    Internal notes
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className={inputClass}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Staff-only notes"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || !hasChanges}
                  className="lux-button w-full rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving…' : hasChanges ? 'Save changes' : 'No changes'}
                </button>
              </form>
            </Panel>
          </div>
        </div>

        {refundOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden">
            <form
              onSubmit={handleRefund}
              className="w-full max-w-md rounded-xl border border-[#e8d5c0] bg-white p-5 shadow-xl space-y-3"
            >
              <h3 className="font-bodoni text-lg text-ink">Process refund</h3>
              <p className="text-xs text-muted">
                Max refundable: {formatPrice(maxRefund)}
                {refundedTotal > 0 ? ` (${formatPrice(refundedTotal)} already refunded)` : ''}
              </p>
              <div>
                <label className="form-label text-xs">Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={String(maxRefund)}
                />
              </div>
              <div>
                <label className="form-label text-xs">Reason</label>
                <input
                  className={inputClass}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Return — size issue"
                />
              </div>
              <div>
                <label className="form-label text-xs">Internal note</label>
                <textarea
                  rows={2}
                  className={inputClass}
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setRefundOpen(false)} className="admin-view-all text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="lux-button rounded-lg px-4 py-2 text-sm">
                  {saving ? 'Processing…' : 'Confirm refund'}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {hasChanges ? (
          <div className="fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between gap-3 rounded-xl border border-[#e8d5c0] bg-white px-4 py-3 shadow-lg lg:hidden">
            <p className="text-sm text-ink">Unsaved changes</p>
            <button
              type="button"
              disabled={saving}
              onClick={() => saveOrder()}
              className="lux-button rounded-lg px-4 py-2 text-xs"
            >
              Save
            </button>
          </div>
        ) : null}
      </div>
    </>
  )
}

export default AdminOrderDetail
