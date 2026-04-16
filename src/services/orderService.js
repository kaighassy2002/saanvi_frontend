import { USE_LOCAL_API } from './config'
import { apiRequest } from './apiClient'
import { getLocalOrders, getLocalOrderById, updateLocalOrder } from './localOrders'

export async function adminFetchOrders() {
  if (USE_LOCAL_API) return getLocalOrders()
  const data = await apiRequest('/api/admin/orders')
  return Array.isArray(data) ? data : data.orders || []
}

export async function adminFetchOrderById(id) {
  if (USE_LOCAL_API) return getLocalOrderById(id)
  const data = await apiRequest(`/api/admin/orders/${id}`)
  return data
}

export async function adminUpdateOrder(id, patch) {
  if (USE_LOCAL_API) return updateLocalOrder(id, patch)
  const data = await apiRequest(`/api/admin/orders/${id}`, { method: 'PATCH', body: patch })
  return data
}
