import React from 'react'
import { createPortal } from 'react-dom'
import {
  BRAND_LOGO_SRC,
} from '../../services/storefrontConstants'
import { useStoreProfile } from '../../hooks/useStoreProfile'
import { formatPaymentMethodLabel, formatPaymentStatusLabel } from '../../services/orderWorkflow'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function formatInvoiceDate(order) {
  const raw = order?.placedAt || order?.date
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw)
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function lineTotal(item) {
  const qty = item.quantity || 1
  const price = Number(item.price) || 0
  return price * qty
}

export default function OrderInvoicePrint({ order, shipping, items }) {
  const { storeName, storeLocation, supportEmail, supportPhone } = useStoreProfile()
  const safeOrder = order || {}
  const safeShipping = shipping || {}
  const lineItems = Array.isArray(items) ? items : []

  const recipientName =
    [safeShipping.firstName, safeShipping.lastName].filter(Boolean).join(' ') ||
    safeOrder.customerName ||
    '—'
  const addressLine = safeShipping.address || safeShipping.line1 || ''
  const cityLine = [safeShipping.city, safeShipping.state, safeShipping.pincode || safeShipping.zip]
    .filter(Boolean)
    .join(', ')

  const itemCount = lineItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const subtotal =
    safeOrder.subtotal != null
      ? Number(safeOrder.subtotal)
      : lineItems.reduce((sum, item) => sum + lineTotal(item), 0)
  const shippingFee = Number(safeOrder.shippingFee) || 0
  const total = Number(safeOrder.total) || subtotal + shippingFee

  const printedAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const orderId = safeOrder.id || '—'
  const invoiceNo = orderId.startsWith('ORD-') ? orderId.replace('ORD-', 'INV-') : `INV-${orderId}`

  const paymentStatus = formatPaymentStatusLabel(safeOrder.paymentStatus)
  const isPaid = String(safeOrder.paymentStatus || '').toLowerCase() === 'paid'

  const invoice = (
    <div id="order-invoice-print" className="order-invoice hidden print:block" aria-hidden="true">
      <div className="order-invoice__accent" aria-hidden="true" />

      <header className="order-invoice__header">
        <div className="order-invoice__brand">
          <img src={BRAND_LOGO_SRC} alt="" className="order-invoice__logo" />
          <div>
            <p className="order-invoice__store-name">{storeName}</p>
            <p className="order-invoice__store-meta">{storeLocation}</p>
            <p className="order-invoice__store-meta">
              {supportEmail} · {supportPhone}
            </p>
          </div>
        </div>
        <div className="order-invoice__title-block">
          <p className="order-invoice__doc-type">Order receipt</p>
          <h1 className="order-invoice__title">Invoice</h1>
          <div className="order-invoice__id-box">
            <span className="order-invoice__id-label">Invoice no.</span>
            <span className="order-invoice__invoice-no">{invoiceNo}</span>
          </div>
          <p className="order-invoice__order-ref">Order ID · {orderId}</p>
          <p className="order-invoice__order-date">{formatInvoiceDate(safeOrder)}</p>
        </div>
      </header>

      <div className="order-invoice__meta-grid">
        <section className="order-invoice__panel">
          <h2 className="order-invoice__panel-heading">Bill to</h2>
          <p className="order-invoice__recipient">{recipientName}</p>
          {safeOrder.customerEmail ? <p>{safeOrder.customerEmail}</p> : null}
          {safeShipping.phone ? <p>Phone: {safeShipping.phone}</p> : null}
        </section>

        <section className="order-invoice__panel">
          <h2 className="order-invoice__panel-heading">Ship to</h2>
          {addressLine ? <p>{addressLine}</p> : null}
          {cityLine ? <p>{cityLine}</p> : null}
          {!addressLine && !cityLine ? <p>—</p> : null}
        </section>

        <section className="order-invoice__panel order-invoice__panel--summary">
          <h2 className="order-invoice__panel-heading">Payment &amp; status</h2>
          <dl className="order-invoice__details">
            <div>
              <dt>Order status</dt>
              <dd>{safeOrder.status || 'Placed'}</dd>
            </div>
            <div>
              <dt>Payment method</dt>
              <dd>{formatPaymentMethodLabel(safeOrder.paymentMethod)}</dd>
            </div>
            <div>
              <dt>Payment status</dt>
              <dd>
                <span
                  className={`order-invoice__status-pill${isPaid ? ' order-invoice__status-pill--paid' : ''}`}
                >
                  {paymentStatus}
                </span>
              </dd>
            </div>
            <div>
              <dt>Items</dt>
              <dd>
                {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <table className="order-invoice__table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Description</th>
            <th scope="col" className="order-invoice__col-qty">
              Qty
            </th>
            <th scope="col" className="order-invoice__col-money">
              Rate
            </th>
            <th scope="col" className="order-invoice__col-money">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {lineItems.length === 0 ? (
            <tr>
              <td colSpan={5} className="order-invoice__empty">
                No items recorded.
              </td>
            </tr>
          ) : (
            lineItems.map((item, index) => {
              const qty = item.quantity || 1
              const name = item.name || item.title || 'Item'
              const variant = item.variantName || item.variantLabel
              return (
                <tr key={index}>
                  <td className="order-invoice__row-num">{index + 1}</td>
                  <td>
                    <span className="order-invoice__item-name">{name}</span>
                    {variant ? <span className="order-invoice__variant">{variant}</span> : null}
                  </td>
                  <td className="order-invoice__col-qty">{qty}</td>
                  <td className="order-invoice__col-money">{formatPrice(item.price)}</td>
                  <td className="order-invoice__col-money">{formatPrice(lineTotal(item))}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      <div className="order-invoice__bottom">
        <div className="order-invoice__totals">
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{shippingFee > 0 ? formatPrice(shippingFee) : 'Free'}</dd>
            </div>
            <div className="order-invoice__total-row">
              <dt>{isPaid ? 'Amount paid' : 'Amount due'}</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <footer className="order-invoice__footer">
        <p className="order-invoice__thanks">Thank you for choosing {storeName}.</p>
        <p>
          Questions about this order? {SUPPORT_EMAIL} · {SUPPORT_PHONE}
        </p>
        <p className="order-invoice__note">
          This invoice confirms your order and payment details. For returns, see our returns policy
          on the website.
        </p>
        <p className="order-invoice__printed">Document generated {printedAt}</p>
      </footer>
    </div>
  )

  return createPortal(invoice, document.body)
}
