import React from 'react'
import { createPortal } from 'react-dom'
import {
  BRAND_LOGO_SRC,
} from '../../services/storefrontConstants'
import { useStoreProfile } from '../../hooks/useStoreProfile'

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

function SingleSlip({ order }) {
  const { storeName, storeLocation, supportEmail, supportPhone } = useStoreProfile()
  const shipping = order.shipping || {}
  const items = Array.isArray(order.items) ? order.items : []
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

  return (
    <div className="packing-slip hidden print:block print:break-after-page mb-8">
      <header className="packing-slip__header">
        <div className="packing-slip__brand">
          <img src={BRAND_LOGO_SRC} alt="" className="packing-slip__logo" />
          <div>
            <p className="packing-slip__store-name">{storeName}</p>
            <p className="packing-slip__store-meta">{storeLocation}</p>
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
              <dd>{itemCount}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{paymentLabel(order.paymentMethod)}</dd>
            </div>
            {order.trackingNumber ? (
              <div>
                <dt>Tracking</dt>
                <dd>{order.trackingNumber}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      </div>
      <table className="packing-slip__table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th className="packing-slip__col-qty">Qty</th>
            <th className="packing-slip__col-money">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{item.name || item.title || 'Item'}</td>
              <td className="packing-slip__col-qty">{item.quantity || 1}</td>
              <td className="packing-slip__col-money">{formatPrice(lineTotal(item))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="packing-slip__totals">
        <dl>
          <div className="packing-slip__total-row">
            <dt>Order total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
      </div>
      <footer className="packing-slip__footer">
        <p>Thank you for shopping with {storeName}. · {supportEmail} · {supportPhone}</p>
      </footer>
    </div>
  )
}

export default function BulkPackingSlipsPrint({ orders }) {
  if (!orders?.length) return null
  return createPortal(
    <div id="bulk-packing-slips">
      {orders.map((order) => (
        <SingleSlip key={order.id} order={order} />
      ))}
    </div>,
    document.body
  )
}
