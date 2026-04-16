import { STORAGE_KEYS } from './config'

const seedCustomers = [
  {
    id: 'usr_1',
    email: 'riya@example.com',
    name: 'Riya Sharma',
    phone: '9876543210',
    createdAt: '2024-01-02',
    disabled: false,
  },
  {
    id: 'usr_2',
    email: 'arjun@example.com',
    name: 'Arjun Mehta',
    phone: '9123456780',
    createdAt: '2023-12-18',
    disabled: false,
  },
  {
    id: 'usr_3',
    email: 'priya@example.com',
    name: 'Priya Nair',
    phone: '9988776655',
    createdAt: '2023-11-05',
    disabled: false,
  },
]

function readCustomers() {
  try {
    const s = localStorage.getItem(STORAGE_KEYS.customers)
    if (!s) {
      localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(seedCustomers))
      return [...seedCustomers]
    }
    return JSON.parse(s)
  } catch {
    return [...seedCustomers]
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
