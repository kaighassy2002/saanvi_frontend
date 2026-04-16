import { USE_LOCAL_API } from './config'
import { apiRequest } from './apiClient'
import { getLocalCustomers, setCustomerDisabledLocal } from './localCustomers'

export async function adminFetchCustomers() {
  if (USE_LOCAL_API) return getLocalCustomers()
  const data = await apiRequest('/api/admin/users')
  return Array.isArray(data) ? data : data.users || []
}

export async function adminSetCustomerDisabled(id, disabled) {
  if (USE_LOCAL_API) return setCustomerDisabledLocal(id, disabled)
  return apiRequest(`/api/admin/users/${id}`, { method: 'PATCH', body: { disabled } })
}
