import React from 'react'

const STATUS_STYLES = {
  placed: 'bg-[#fff6eb] text-[#9f7a2c]',
  confirmed: 'bg-[#f5ead7] text-[#7a2c3a]',
  packed: 'bg-[#fff6eb] text-[#9f7a2c]',
  shipped: 'bg-[#f8f1e6] text-[#9f7a2c]',
  outfordelivery: 'bg-[#f8f1e6] text-[#7a2c3a]',
  delivered: 'bg-[#f0f4ee] text-[#5a6b52]',
  cancelled: 'bg-[#f7ecee] text-[#7a2c3a]',
  returnrequested: 'bg-[#f8f1e6] text-[#9f7a2c]',
  returned: 'bg-[#f8f1e6] text-[#6f5d5b]',
  pending: 'bg-[#fff6eb] text-[#9f7a2c]',
  paid: 'bg-[#f0f4ee] text-[#5a6b52]',
  failed: 'bg-[#f7ecee] text-[#7a2c3a]',
  refunded: 'bg-[#f8f1e6] text-[#6f5d5b]',
  processing: 'bg-[#fff6eb] text-[#9f7a2c]',
}

function AdminStatusBadge({ status }) {
  const key = String(status || '')
    .toLowerCase()
    .replace(/\s+/g, '')
  const style = STATUS_STYLES[key] || 'bg-stone-100 text-stone-700'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status || '—'}
    </span>
  )
}

export const ORDER_STATUS_OPTIONS = [
  'Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
  'Cancelled',
  'Return Requested',
  'Returned',
]

export const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded']

export default AdminStatusBadge
