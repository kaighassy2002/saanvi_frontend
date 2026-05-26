/**
 * Admin API wrappers — pass authFetch from useAdminAuth().
 */

export async function listProducts(authFetch) {
  const data = await authFetch('/api/admin/products')
  return Array.isArray(data?.products) ? data.products : []
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

export async function listOrders(authFetch) {
  const data = await authFetch('/api/admin/orders')
  return Array.isArray(data?.orders) ? data.orders : []
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
