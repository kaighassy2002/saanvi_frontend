/**
 * Admin API wrappers — pass authFetch from useAdminAuth().
 */

function buildQuery(params) {
  const q = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

function normalizeList(data) {
  const items = data?.items ?? data?.products ?? data?.orders ?? data?.users ?? []
  return {
    items: Array.isArray(items) ? items : [],
    total: Number(data?.total) || items.length,
    page: Number(data?.page) || 1,
    limit: Number(data?.limit) || items.length,
    pages: Number(data?.pages) || 1,
  }
}

// --- Dashboard ---

export async function getDashboardSummary(authFetch, params = {}) {
  return authFetch(`/api/admin/dashboard/summary${buildQuery(params)}`)
}

// --- Products ---

export async function listProducts(authFetch, params = {}) {
  const data = await authFetch(`/api/admin/products${buildQuery(params)}`)
  return normalizeList(data)
}

export async function listProductsAll(authFetch) {
  const data = await authFetch('/api/admin/products?limit=500')
  const list = normalizeList(data)
  return list.items
}

export async function getProduct(authFetch, id) {
  return authFetch(`/api/admin/products/${encodeURIComponent(id)}`)
}

export async function createProduct(authFetch, body) {
  return authFetch('/api/admin/products', { method: 'POST', body })
}

export async function updateProduct(authFetch, id, body) {
  return authFetch(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
}

export async function deleteProduct(authFetch, id) {
  return authFetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function bulkProducts(authFetch, ids, action) {
  return authFetch('/api/admin/products/bulk', {
    method: 'PATCH',
    body: { ids, action },
  })
}

export async function duplicateProduct(authFetch, id) {
  return authFetch(`/api/admin/products/${encodeURIComponent(id)}/duplicate`, { method: 'POST' })
}

export async function downloadProductsExport() {
  const { API_BASE, STORAGE_KEYS } = await import('../../services/config')
  const token = localStorage.getItem(STORAGE_KEYS.adminToken)
  const res = await fetch(`${API_BASE}/api/admin/products/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Export failed')
  return res.text()
}

export async function importProductsCsv(authFetch, csv) {
  return authFetch('/api/admin/products/import', { method: 'POST', body: { csv } })
}

// --- Inventory ---

export async function getAllStock(authFetch, params = {}) {
  const data = await authFetch(`/api/admin/inventory/stock${buildQuery(params)}`)
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    categories: Array.isArray(data?.categories) ? data.categories : [],
    total: Number(data?.total) || 0,
  }
}

export async function getLowStock(authFetch) {
  const data = await authFetch('/api/admin/inventory/low-stock')
  return Array.isArray(data?.items) ? data.items : []
}

export async function getStockMovements(authFetch, params = {}) {
  const data = await authFetch(`/api/admin/inventory/movements${buildQuery(params)}`)
  return Array.isArray(data?.movements) ? data.movements : []
}

export async function adjustStock(authFetch, body) {
  return authFetch('/api/admin/inventory/adjust', { method: 'POST', body })
}

export async function submitStockTake(authFetch, body) {
  return authFetch('/api/admin/inventory/stock-take', { method: 'POST', body })
}

// --- Orders ---

export async function listOrders(authFetch, params = {}) {
  const data = await authFetch(`/api/admin/orders${buildQuery(params)}`)
  return normalizeList(data)
}

export async function listOrdersAll(authFetch) {
  const data = await authFetch('/api/admin/orders?limit=500')
  return normalizeList(data).items
}

export async function downloadOrdersExport(params = {}) {
  const { API_BASE, STORAGE_KEYS } = await import('../../services/config')
  const token = localStorage.getItem(STORAGE_KEYS.adminToken)
  const res = await fetch(`${API_BASE}/api/admin/orders/export${buildQuery(params)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Export failed')
  return res.blob()
}

export async function getOrder(authFetch, publicId) {
  return authFetch(`/api/admin/orders/${encodeURIComponent(publicId)}`)
}

export async function patchOrder(authFetch, publicId, body) {
  return authFetch(`/api/admin/orders/${encodeURIComponent(publicId)}`, {
    method: 'PATCH',
    body,
  })
}

export async function bulkOrders(authFetch, ids, action, note) {
  return authFetch('/api/admin/orders/bulk', {
    method: 'PATCH',
    body: { ids, action, note },
  })
}

export async function downloadOrderInvoice(publicId) {
  const { API_BASE, STORAGE_KEYS } = await import('../../services/config')
  const token = localStorage.getItem(STORAGE_KEYS.adminToken)
  const res = await fetch(`${API_BASE}/api/admin/orders/${encodeURIComponent(publicId)}/invoice`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Invoice download failed')
  }
  return res.blob()
}

export async function confirmCodOrder(authFetch, publicId, note) {
  return authFetch(`/api/admin/orders/${encodeURIComponent(publicId)}/confirm-cod`, {
    method: 'POST',
    body: { note },
  })
}

export async function processOrderRefund(authFetch, publicId, body) {
  return authFetch(`/api/admin/orders/${encodeURIComponent(publicId)}/refund`, {
    method: 'POST',
    body,
  })
}

export async function rmaOrderAction(authFetch, publicId, step, note) {
  return authFetch(`/api/admin/orders/${encodeURIComponent(publicId)}/rma`, {
    method: 'POST',
    body: { step, note },
  })
}

export async function generateCourierAwb(authFetch, publicId, partner) {
  return authFetch(`/api/admin/orders/${encodeURIComponent(publicId)}/courier/awb`, {
    method: 'POST',
    body: { partner },
  })
}

export async function getCourierStatus(authFetch) {
  return authFetch('/api/admin/orders/courier-status')
}

// --- Categories (legacy strings) ---

export async function getCategories(authFetch) {
  const data = await authFetch('/api/admin/categories')
  return Array.isArray(data?.categories) ? data.categories : []
}

export async function putCategories(authFetch, categories) {
  const data = await authFetch('/api/admin/categories', {
    method: 'PUT',
    body: { categories },
  })
  return Array.isArray(data?.categories) ? data.categories : categories
}

// --- Rich catalog categories ---

export async function listCatalogCategories(authFetch) {
  const data = await authFetch('/api/admin/catalog/categories')
  return Array.isArray(data?.categories) ? data.categories : []
}

export async function createCatalogCategory(authFetch, body) {
  return authFetch('/api/admin/catalog/categories', { method: 'POST', body })
}

export async function updateCatalogCategory(authFetch, id, body) {
  return authFetch(`/api/admin/catalog/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
}

export async function deleteCatalogCategory(authFetch, id) {
  return authFetch(`/api/admin/catalog/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

// --- Catalog collections ---

export async function listCatalogCollections(authFetch) {
  const data = await authFetch('/api/admin/catalog/collections')
  return Array.isArray(data?.collections) ? data.collections : []
}

export async function createCatalogCollection(authFetch, body) {
  return authFetch('/api/admin/catalog/collections', { method: 'POST', body })
}

export async function updateCatalogCollection(authFetch, id, body) {
  return authFetch(`/api/admin/catalog/collections/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
}

export async function deleteCatalogCollection(authFetch, id) {
  return authFetch(`/api/admin/catalog/collections/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

// --- Merchandising ---

export async function getNewArrivals(authFetch) {
  const data = await authFetch('/api/admin/merchandising/new-arrivals')
  return Array.isArray(data?.ids) ? data.ids.map(String) : []
}

export async function putNewArrivals(authFetch, ids) {
  const data = await authFetch('/api/admin/merchandising/new-arrivals', {
    method: 'PUT',
    body: { ids },
  })
  return Array.isArray(data?.ids) ? data.ids.map(String) : ids
}

// --- Settings ---

export async function getAdminSettings(authFetch) {
  const data = await authFetch('/api/admin/settings')
  return data?.settings ?? data ?? {}
}

export async function putAdminSettings(authFetch, settings) {
  const data = await authFetch('/api/admin/settings', {
    method: 'PUT',
    body: { settings },
  })
  return data?.settings ?? settings
}

export async function getIntegrationsHealth(authFetch) {
  return authFetch('/api/admin/settings/integrations')
}

export async function getShippingSettings(authFetch) {
  const data = await authFetch('/api/admin/shipping')
  const shipping = data?.shipping ?? data ?? {}
  return {
    shippingFee: Number(shipping.shippingFee) || 0,
    freeShippingThreshold: Number(shipping.freeShippingThreshold) || 0,
  }
}

export async function putShippingSettings(authFetch, shipping) {
  const data = await authFetch('/api/admin/shipping', {
    method: 'PUT',
    body: { shipping },
  })
  const saved = data?.shipping ?? data ?? shipping
  return {
    shippingFee: Number(saved.shippingFee) || 0,
    freeShippingThreshold: Number(saved.freeShippingThreshold) || 0,
  }
}

// --- Customers ---

export async function listUsers(authFetch, params = {}) {
  const data = await authFetch(`/api/admin/users${buildQuery(params)}`)
  return normalizeList(data)
}

export async function getUser(authFetch, id) {
  return authFetch(`/api/admin/users/${encodeURIComponent(id)}`)
}

export async function patchUser(authFetch, id, body) {
  return authFetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
}

export async function patchUserDisabled(authFetch, id, disabled) {
  return authFetch(`/api/admin/users/${encodeURIComponent(id)}/disabled`, {
    method: 'PATCH',
    body: { disabled: Boolean(disabled) },
  })
}

// --- Analytics ---

export async function getSalesAnalytics(authFetch, params = {}) {
  return authFetch(`/api/admin/analytics/sales${buildQuery(params)}`)
}

export async function getProductAnalytics(authFetch) {
  return authFetch('/api/admin/analytics/products')
}

// --- Size charts & coupons (P2 admin UI) ---

export async function listSizeCharts(authFetch) {
  const data = await authFetch('/api/admin/size-charts')
  return Array.isArray(data?.sizeCharts) ? data.sizeCharts : []
}

export async function listCoupons(authFetch) {
  const data = await authFetch('/api/admin/coupons')
  return Array.isArray(data?.coupons) ? data.coupons : []
}

export async function createCoupon(authFetch, body) {
  return authFetch('/api/admin/coupons', { method: 'POST', body })
}

export async function updateCoupon(authFetch, id, body) {
  return authFetch(`/api/admin/coupons/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
}

export async function deleteCoupon(authFetch, id) {
  return authFetch(`/api/admin/coupons/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function createSizeChart(authFetch, body) {
  return authFetch('/api/admin/size-charts', { method: 'POST', body })
}

export async function updateSizeChart(authFetch, id, body) {
  return authFetch(`/api/admin/size-charts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
}

export async function deleteSizeChart(authFetch, id) {
  return authFetch(`/api/admin/size-charts/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
