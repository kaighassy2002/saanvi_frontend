import { STORAGE_KEYS } from './config'

const CUSTOMERS_STORAGE_VERSION = '2'

function ensureCustomersMigrated() {
  const versionKey = `${STORAGE_KEYS.customers}_version`
  if (localStorage.getItem(versionKey) === CUSTOMERS_STORAGE_VERSION) return
  localStorage.removeItem(STORAGE_KEYS.customers)
  localStorage.setItem(versionKey, CUSTOMERS_STORAGE_VERSION)
}

function readCustomers() {
  ensureCustomersMigrated()
  try {
    const s = localStorage.getItem(STORAGE_KEYS.customers)
    if (!s) return []
    const parsed = JSON.parse(s)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getLocalCustomers() {
  return readCustomers()
}

export function setCustomerDisabledLocal(customerId, disabled) {
  const list = readCustomers()
  const idx = list.findIndex((c) => c.id === customerId)
  if (idx < 0) return null
  const next = [...list]
  next[idx] = { ...next[idx], disabled: !!disabled }
  localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(next))
  return next[idx]
}
