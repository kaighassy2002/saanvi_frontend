export const PERMISSIONS = [
  'dashboard',
  'orders',
  'catalog',
  'customers',
  'marketing',
  'analytics',
  'settings',
  'staff',
]

export const PERMISSION_LABELS = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  catalog: 'Catalog & inventory',
  customers: 'Customers',
  marketing: 'Marketing & reviews',
  analytics: 'Analytics',
  settings: 'Store settings',
  staff: 'Staff management',
}

export const ROLE_DEFAULT_PERMISSIONS = {
  owner: [...PERMISSIONS],
  admin: [...PERMISSIONS],
  catalog: ['dashboard', 'catalog'],
  fulfillment: ['dashboard', 'orders'],
  support: ['dashboard', 'orders', 'customers', 'marketing'],
}

const ROUTE_PERMISSIONS = {
  '/admin': 'dashboard',
  '/admin/orders': 'orders',
  '/admin/products': 'catalog',
  '/admin/products/new': 'catalog',
  '/admin/categories': 'catalog',
  '/admin/collections': 'catalog',
  '/admin/inventory': 'catalog',
  '/admin/size-charts': 'catalog',
  '/admin/customers': 'customers',
  '/admin/merchandising': 'marketing',
  '/admin/coupons': 'marketing',
  '/admin/reviews': 'marketing',
  '/admin/analytics': 'analytics',
  '/admin/settings': 'settings',
  '/admin/staff': 'staff',
}

export function getProfilePermissions(profile) {
  if (!profile) return new Set()
  const explicit = Array.isArray(profile.effectivePermissions)
    ? profile.effectivePermissions
    : Array.isArray(profile.permissions) && profile.permissions.length
      ? profile.permissions
      : ROLE_DEFAULT_PERMISSIONS[String(profile.role || 'owner').toLowerCase()] || []
  return new Set(explicit)
}

export function hasAdminPermission(profile, permission) {
  return getProfilePermissions(profile).has(permission)
}

export function canAccessAdminPath(profile, pathname) {
  const path = String(pathname || '').replace(/\/$/, '') || '/admin'
  if (path === '/admin/account') return true
  if (path.includes('/products/') && path.endsWith('/edit')) {
    return hasAdminPermission(profile, 'catalog')
  }
  if (path.includes('/orders/')) {
    return hasAdminPermission(profile, 'orders')
  }
  if (path.includes('/customers/')) {
    return hasAdminPermission(profile, 'customers')
  }
  const key = ROUTE_PERMISSIONS[path]
  if (!key) return true
  return hasAdminPermission(profile, key)
}

export function firstAllowedAdminPath(profile) {
  const order = [
    '/admin',
    '/admin/orders',
    '/admin/products',
    '/admin/customers',
    '/admin/merchandising',
    '/admin/analytics',
    '/admin/settings',
    '/admin/account',
  ]
  return order.find((path) => canAccessAdminPath(profile, path)) || '/admin/account'
}

export function navItemPermission(to) {
  return ROUTE_PERMISSIONS[to.replace(/\/$/, '') || '/admin'] || null
}
