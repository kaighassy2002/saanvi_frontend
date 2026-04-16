import { STORAGE_KEYS } from './config'
import { getCustomerStorageScope } from './customerStorageScope'

export function savedAddressesStorageKey(scope) {
  return `jewellery_saved_addresses::__scope_${scope}`
}

export function createAddressId() {
  return `addr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function writeForScope(scope, list) {
  localStorage.setItem(savedAddressesStorageKey(scope), JSON.stringify(list))
}

/**
 * @returns {Array<{ id: string, label: string, firstName: string, lastName: string, phone: string, address: string, city: string, state: string, pincode: string }>}
 */
export function readSavedAddresses() {
  const scope = getCustomerStorageScope()
  const key = savedAddressesStorageKey(scope)
  try {
    const s = localStorage.getItem(key)
    if (s) {
      const p = JSON.parse(s)
      if (Array.isArray(p) && p.length > 0) return p.filter((a) => a && a.id)
    }
    const migrated = migrateLegacySingleAddress()
    if (migrated.length) {
      writeForScope(scope, migrated)
      localStorage.removeItem(STORAGE_KEYS.customerAddress)
      return migrated
    }
    return []
  } catch {
    return []
  }
}

function migrateLegacySingleAddress() {
  try {
    const legacy = localStorage.getItem(STORAGE_KEYS.customerAddress)
    if (!legacy) return []
    const o = JSON.parse(legacy)
    if (!o || typeof o !== 'object') return []
    if (!o.address && !o.city && !o.pincode) return []
    return [
      {
        id: createAddressId(),
        label: 'Address 1',
        firstName: String(o.firstName || ''),
        lastName: String(o.lastName || ''),
        phone: String(o.phone || ''),
        address: String(o.address || ''),
        city: String(o.city || ''),
        state: String(o.state || ''),
        pincode: String(o.pincode || ''),
      },
    ]
  } catch {
    return []
  }
}

export function writeSavedAddresses(list) {
  writeForScope(getCustomerStorageScope(), Array.isArray(list) ? list : [])
}
