import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { whatsappUrl } from '../../services/storefrontConstants'
import { productImageUrl } from '../../utils/cloudinaryImage'
import {
  buildCustomerTimeline,
  canCustomerCancel,
  canCustomerReturn,
  flowIndex,
  formatOrderDateTime,
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  ORDER_STATUS_FLOW,
  orderStatusNote,
  orderStatusTone,
} from '../../services/orderWorkflow'
import { cancelMyOrder, returnMyOrder } from '../../services/storefrontOrderService'
import { printOrderInvoice } from '../../utils/printOrderInvoice'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function StatusStepper({ status }) {
  const current = flowIndex(status)
  if (status === 'Cancelled' || status === 'Returned' || status === 'Return Requested') {
    return (
      <div className="order-expand__stepper order-expand__stepper--terminal">
        <span className="order-expand__terminal-badge">{status}</span>
      </div>
    )
  }
  return (
    <div className="order-expand__stepper">
      {ORDER_STATUS_FLOW.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <div
            key={step}
            className={`order-expand__step${done ? ' order-expand__step--done' : ''}${active ? ' order-expand__step--active' : ''}`}
          >
            <span className="order-expand__step-dot" aria-hidden />
            <span className="order-expand__step-label">{step}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function OrderDetailPanel({ order, onOrderUpdated, onClose }) {
  const [actionBusy, setActionBusy] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  if (!order) return null

  const shipping = order.shipping || {}
  const items = Array.isArray(order.items) ? order.items : []
  const timeline = buildCustomerTimeline(order)
  const statusTone = orderStatusTone(order.status)
  const statusNote = orderStatusNote(order.status)

  const subtotal =
    order.subtotal != null
      ? Number(order.subtotal)
      : items.reduce((s, i) => s + (Number(i.price) || 0) * (i.quantity || 1), 0)
  const shippingFee = Number(order.shippingFee) || 0
  const total = Number(order.total) || subtotal + shippingFee

  const handleCancelRequest = async () => {
    const raw = window.prompt('Reason for cancellation (optional):')
    if (raw === null) return
    setActionBusy(true)
    setActionMsg('')
    try {
      const updated = await cancelMyOrder(order.id, raw.trim() || 'Customer requested cancellation')
      onOrderUpdated?.(updated)
      setActionMsg('Cancellation request submitted.')
    } catch (e) {
      setActionMsg(e?.message || 'Could not submit cancellation')
    } finally {
      setActionBusy(false)
    }
  }

  const handleReturnRequest = async () => {
    const raw = window.prompt('Reason for return (optional):')
    if (raw === null) return
    setActionBusy(true)
    setActionMsg('')
    try {
      const updated = await returnMyOrder(order.id, raw.trim() || 'Customer requested return')
      onOrderUpdated?.(updated)
      setActionMsg('Return request submitted.')
    } catch (e) {
      setActionMsg(e?.message || 'Could not submit return')
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <div className="order-expand" id={`order-expand-${order.id}`}>
      <div className="order-expand__head">
        <div>
          <p className="order-expand__kicker">Order details</p>
          <p className="order-expand__id">{order.id}</p>
          <p className="order-expand__meta">
            Placed {formatOrderDateTime(order.placedAt || order.date)}
          </p>
        </div>
        <div className="order-expand__badges">
          <span className={`order-expand__badge order-expand__badge--${statusTone}`}>
            {order.status}
          </span>
          <span className="order-expand__badge order-expand__badge--pay">
            Payment {formatPaymentStatusLabel(order.paymentStatus)}
          </span>
        </div>
        {onClose ? (
          <button type="button" className="order-expand__close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        ) : null}
      </div>

      {statusNote ? <p className="order-expand__note">{statusNote}</p> : null}
      <StatusStepper status={order.status} />

      <div className="order-expand__grid">
        <section className="order-expand__section">
          <h3 className="order-expand__section-title">Items</h3>
          {items.map((item, index) => (
            <div key={index} className="order-expand__line">
              <img
                src={productImageUrl(item.image, 'thumb')}
                alt=""
                className="order-expand__thumb"
              />
              <div className="order-expand__line-info">
                <p className="order-expand__line-name">{item.name}</p>
                <p className="order-expand__line-meta">
                  Qty {item.quantity || 1}
                  {item.variantName ? ` · ${item.variantName}` : ''}
                </p>
              </div>
              <p className="order-expand__line-price">
                {formatPrice((Number(item.price) || 0) * (item.quantity || 1))}
              </p>
            </div>
          ))}
          <div className="order-expand__totals">
            <div>
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div>
              <span>Shipping</span>
              <span>{formatPrice(shippingFee)}</span>
            </div>
            <div className="order-expand__totals-grand">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <p className="order-expand__pay-method">{formatPaymentMethodLabel(order.paymentMethod)}</p>
          </div>
        </section>

        <section className="order-expand__section">
          <h3 className="order-expand__section-title">Delivery</h3>
          <p className="order-expand__address">
            <strong>
              {[shipping.firstName, shipping.lastName].filter(Boolean).join(' ') ||
                order.customerName}
            </strong>
            <br />
            {shipping.address}
            <br />
            {[shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(', ')}
            <br />
            {shipping.phone}
            <br />
            {order.customerEmail}
          </p>
          {order.trackingNumber || order.courierPartner ? (
            <p className="order-expand__tracking">
              <i className="fa-solid fa-truck-fast" aria-hidden />{' '}
              {order.courierPartner ? `${order.courierPartner} · ` : ''}
              {order.trackingUrl ? (
                <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="order-expand__tracking-link">
                  Track {order.trackingNumber || 'shipment'}
                </a>
              ) : order.trackingNumber ? (
                `Tracking ${order.trackingNumber}`
              ) : (
                ''
              )}
            </p>
          ) : null}

          <h3 className="order-expand__section-title">Activity</h3>
          <ul className="order-expand__timeline">
            {timeline.map((entry, i) => (
              <li key={i}>
                <span className="order-expand__timeline-when">{formatOrderDateTime(entry.at)}</span>
                <span className="order-expand__timeline-note">{entry.note || entry.status}</span>
              </li>
            ))}
          </ul>

          <div className="order-expand__actions">
            <button
              type="button"
              className="order-expand__btn order-expand__btn--primary"
              onClick={() => printOrderInvoice(order.id)}
            >
              <i className="fa-solid fa-file-invoice" aria-hidden />
              Invoice
            </button>
            {canCustomerCancel(order.status) && !order.cancellationRequestedAt ? (
              <button
                type="button"
                className="order-expand__btn"
                disabled={actionBusy}
                onClick={handleCancelRequest}
              >
                Cancel
              </button>
            ) : null}
            {canCustomerReturn(order.status) && !order.returnRequestedAt ? (
              <button
                type="button"
                className="order-expand__btn"
                disabled={actionBusy}
                onClick={handleReturnRequest}
              >
                Return
              </button>
            ) : null}
            <a
              href={whatsappUrl(`Hi, I need help with order ${order.id}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="order-expand__btn"
            >
              <i className="fab fa-whatsapp" aria-hidden />
              Help
            </a>
            <Link to="/returns" className="order-expand__btn order-expand__btn--link">
              Return policy
            </Link>
          </div>
          {actionMsg ? <p className="order-expand__action-msg">{actionMsg}</p> : null}
        </section>
      </div>
    </div>
  )
}
