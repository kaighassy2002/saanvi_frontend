import React from 'react'
import { PaymentSplitChart } from './AdminDashboardCharts'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function AdminDashboardPaymentSplit({ paymentSplit, formatPrice: formatFn = formatPrice }) {
  if (!paymentSplit) {
    return <p className="text-sm text-muted py-12 text-center">No payment data for this period.</p>
  }

  const { cod = {}, prepaid = {}, codAtRisk = {} } = paymentSplit
  const totalOrders = (cod.orders || 0) + (prepaid.orders || 0)

  if (!totalOrders) {
    return <p className="text-sm text-muted py-12 text-center">No orders in this period.</p>
  }

  return (
    <div className="admin-payment-split">
      <PaymentSplitChart cod={cod} prepaid={prepaid} formatPrice={formatFn} />

      <div className="admin-payment-split__stats mt-4 grid grid-cols-2 gap-2">
        <div className="admin-payment-split__stat">
          <p className="admin-payment-split__stat-label">COD orders</p>
          <p className="admin-payment-split__stat-value">{cod.orders || 0}</p>
          <p className="admin-payment-split__stat-sub">{formatFn(cod.revenue)}</p>
        </div>
        <div className="admin-payment-split__stat">
          <p className="admin-payment-split__stat-label">Prepaid orders</p>
          <p className="admin-payment-split__stat-value">{prepaid.orders || 0}</p>
          <p className="admin-payment-split__stat-sub">{formatFn(prepaid.revenue)}</p>
        </div>
      </div>

      {(codAtRisk.orders || 0) > 0 ? (
        <div className="admin-payment-split__risk mt-3">
          <p className="admin-payment-split__risk-title">COD at risk</p>
          <p className="admin-payment-split__risk-text">
            {codAtRisk.orders} COD order{codAtRisk.orders === 1 ? '' : 's'} in Placed or Confirmed status.
            Confirm quickly or follow up to reduce RTO.
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default AdminDashboardPaymentSplit
