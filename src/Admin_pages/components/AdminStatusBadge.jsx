import React from 'react'

const STATUS_STYLES = {
  processing: 'bg-amber-50 text-amber-900',
  paid: 'bg-emerald-50 text-emerald-900',
  shipped: 'bg-blue-50 text-blue-900',
  delivered: 'bg-emerald-50 text-emerald-800',
  cancelled: 'bg-red-50 text-red-800',
  pending: 'bg-[#fff6eb] text-[#9a3412]',
}

function AdminStatusBadge({ status }) {
  const key = String(status || '')
    .toLowerCase()
    .replace(/\s+/g, '')
  const style = STATUS_STYLES[key] || 'bg-stone-100 text-stone-700'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {status || '—'}
    </span>
  )
}

export const ORDER_STATUS_OPTIONS = [
  'Processing',
  'Paid',
  'Shipped',
  'Delivered',
  'Cancelled',
]

export default AdminStatusBadge
