import React from 'react'
import { createPortal } from 'react-dom'
import {
  BRAND_LOGO_SRC,
  STORE_LOCATION,
  STORE_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
} from '../../services/storefrontConstants'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function paymentLabel(method) {
  if (method === 'razorpay') return 'Prepaid — Online (UPI / Card)'
  if (method === 'cod') return 'Cash on Delivery'
  return method || '—'
}

function lineTotal(item) {
  const qty = item.quantity || 1
  const price = Number(item.price) || 0
  if (item.lineTotal != null) return Number(item.lineTotal)
  return price * qty
}

export default function PackingSlipPrint({ order, shipping, items }) {
  const recipientName =
    [shipping.firstName, shipping.lastName].filter(Boolean).join(' ') || order.customerName || '—'

  const addressLine = shipping.address || shipping.line1 || ''
  const cityLine = [shipping.city, shipping.state, shipping.pincode || shipping.zip]
    .filter(Boolean)
    .join(', ')

  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const subtotal =
    order.subtotal != null
      ? Number(order.subtotal)
      : items.reduce((sum, item) => sum + lineTotal(item), 0)
  const shippingFee = Number(order.shippingFee) || 0
  const total = Number(order.total) || subtotal + shippingFee

  const printedAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const slip = (
    <div id="order-print-slip" className="packing-slip hidden print:block">
      <header className="packing-slip__header">
        <div className="packing-slip__brand">
          <img src={BRAND_LOGO_SRC} alt="" className="packing-slip__logo" />
          <div>
            <p className="packing-slip__store-name">{STORE_NAME}</p>
            <p className="packing-slip__store-meta">{STORE_LOCATION}</p>
          </div>
        </div>
        <div className="packing-slip__title-block">
          <h1 className="packing-slip__title">Packing slip</h1>
          <p className="packing-slip__order-id">{order.id}</p>
        </div>
      </header>

      <div className="packing-slip__meta-grid">
        <section className="packing-slip__panel">
          <h2 className="packing-slip__panel-heading">Ship to</h2>
          <p className="packing-slip__recipient">{recipientName}</p>
          {addressLine ? <p>{addressLine}</p> : null}
          {cityLine ? <p>{cityLine}</p> : null}
          {shipping.phone ? <p className="packing-slip__phone">Phone: {shipping.phone}</p> : null}
          {order.customerEmail ? (
            <p className="packing-slip__email">{order.customerEmail}</p>
          ) : null}
        </section>

        <section className="packing-slip__panel">
          <h2 className="packing-slip__panel-heading">Order details</h2>
          <dl className="packing-slip__details">
            <div>
              <dt>Order date</dt>
              <dd>{order.date || '—'}</dd>
            </div>
            <div>
              <dt>Items</dt>
              <dd>
                {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
              </dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{paymentLabel(order.paymentMethod)}</dd>
            </div>
            {order.trackingNumber ? (
              <div>
                <dt>Tracking</dt>
                <dd className="packing-slip__tracking">{order.trackingNumber}</dd>
              </div>
            ) : null}
            <div>
              <dt>Printed</dt>
              <dd>{printedAt}</dd>
            </div>
          </dl>
        </section>
      </div>

      <table className="packing-slip__table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Item</th>
            <th scope="col" className="packing-slip__col-qty">
              Qty
            </th>
            <th scope="col" className="packing-slip__col-money">
              Unit price
            </th>
            <th scope="col" className="packing-slip__col-money">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="packing-slip__empty">
                No items recorded.
              </td>
            </tr>
          ) : (
            items.map((item, index) => {
              const qty = item.quantity || 1
              const name = item.name || item.title || 'Item'
              const variant = item.variantName || item.variantLabel
              return (
                <tr key={index}>
                  <td className="packing-slip__row-num">{index + 1}</td>
                  <td>
                    <span className="packing-slip__item-name">{name}</span>
                    {variant ? <span className="packing-slip__variant">{variant}</span> : null}
                  </td>
                  <td className="packing-slip__col-qty">{qty}</td>
                  <td className="packing-slip__col-money">{formatPrice(item.price)}</td>
                  <td className="packing-slip__col-money">{formatPrice(lineTotal(item))}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      <div className="packing-slip__totals">
        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{shippingFee > 0 ? formatPrice(shippingFee) : 'Free'}</dd>
          </div>
          <div className="packing-slip__total-row">
            <dt>Order total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
      </div>

      <footer className="packing-slip__footer">
        <p>Thank you for shopping with {STORE_NAME}.</p>
        <p>
          Questions? {SUPPORT_EMAIL} · {SUPPORT_PHONE}
        </p>
        <p className="packing-slip__note">
          This document is a packing slip for fulfilment — not a tax invoice.
        </p>
      </footer>
    </div>
  )

  return createPortal(slip, document.body)
}
