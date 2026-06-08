import React from 'react'

const props = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function KpiIconRevenue() {
  return (
    <svg {...props}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

export function KpiIconOrders() {
  return (
    <svg {...props}>
      <path d="M6 6h15l-1.5 9H7.5L6 6z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  )
}

export function KpiIconCustomers() {
  return (
    <svg {...props}>
      <circle cx="9" cy="7" r="3.5" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M3 20c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5M14 20c0-2.5 1.5-4 3.5-4.5" />
    </svg>
  )
}

export function KpiIconProducts() {
  return (
    <svg {...props}>
      <path d="M12 2 3 7v10l9 5 9-5V7l-9-5z" />
      <path d="M12 12v10M3 7l9 5 9-5" />
    </svg>
  )
}

export function KpiIconPending() {
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

const ICONS = {
  revenue: KpiIconRevenue,
  orders: KpiIconOrders,
  customers: KpiIconCustomers,
  products: KpiIconProducts,
  pending: KpiIconPending,
}

export function AdminKpiIcon({ name }) {
  const Icon = ICONS[name]
  return Icon ? <Icon /> : null
}
