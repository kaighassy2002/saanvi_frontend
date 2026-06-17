import React from 'react'

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function IconDashboard() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

export function IconOrders() {
  return (
    <svg {...iconProps}>
      <path d="M6 6h15l-1.5 9H7.5L6 6z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  )
}

export function IconProducts() {
  return (
    <svg {...iconProps}>
      <path d="M12 2 3 7v10l9 5 9-5V7l-9-5z" />
      <path d="M3 7l9 5 9-5M12 22V12" />
    </svg>
  )
}

export function IconCategories() {
  return (
    <svg {...iconProps}>
      <path d="M4 6h7v7H4zM13 6h7v4h-7zM13 13h7v7h-7zM4 16h7v4H4z" />
    </svg>
  )
}

export function IconInventory() {
  return (
    <svg {...iconProps}>
      <path d="M4 7h16v13H4z" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M12 12v4M10 14h4" />
    </svg>
  )
}

export function IconCustomers() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  )
}

export function IconMerchandising() {
  return (
    <svg {...iconProps}>
      <path d="m12 3 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.2l5-.7L12 3z" />
    </svg>
  )
}

export function IconReviews() {
  return (
    <svg {...iconProps}>
      <path d="M4 5h16v11H7l-3 3V5z" />
      <path d="M8 10h8M8 13h5" />
    </svg>
  )
}

export function IconAnalytics() {
  return (
    <svg {...iconProps}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </svg>
  )
}

export function IconSettings() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

export function IconSizeCharts() {
  return (
    <svg {...iconProps}>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <path d="M8 5v14M16 5v14" />
    </svg>
  )
}

export function IconCoupons() {
  return (
    <svg {...iconProps}>
      <path d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      <path d="M9 12h6" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconCollections() {
  return (
    <svg {...iconProps}>
      <path d="M4 6h16v4H4z" />
      <path d="M4 14h10v4H4z" />
      <path d="M18 14h2v4h-2z" />
    </svg>
  )
}

export function IconStaff() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3 2.5-5 6-5" />
      <path d="M16 11h5M18.5 8.5v5" />
    </svg>
  )
}

const ICON_MAP = {
  dashboard: IconDashboard,
  orders: IconOrders,
  products: IconProducts,
  categories: IconCategories,
  inventory: IconInventory,
  customers: IconCustomers,
  merchandising: IconMerchandising,
  reviews: IconReviews,
  analytics: IconAnalytics,
  settings: IconSettings,
  staff: IconStaff,
  account: IconCustomers,
  'size-charts': IconSizeCharts,
  coupons: IconCoupons,
  collections: IconCollections,
}

export function AdminNavIcon({ name }) {
  const Icon = ICON_MAP[name]
  return Icon ? <Icon /> : null
}
