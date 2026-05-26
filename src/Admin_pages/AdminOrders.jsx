import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { listOrders } from './services/adminApi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminDataTable from './components/AdminDataTable'
import AdminStatusBadge from './components/AdminStatusBadge'
import AdminErrorBanner from './components/AdminErrorBanner'

const FILTER_OPTIONS = ['All', 'Processing', 'Paid', 'Shipped', 'Delivered', 'Cancelled']

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function AdminOrders() {
  const { authFetch } = useAdminAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setOrders(await listOrders(authFetch))
    } catch (e) {
      setError(e?.message || 'Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return orders
    return orders.filter(
      (o) => String(o.status || '').toLowerCase() === statusFilter.toLowerCase()
    )
  }, [orders, statusFilter])

  const columns = [
    { key: 'id', label: 'Order ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date' },
  ]

  return (
    <div>
      <AdminPageHeader title="Orders" description="View and fulfill customer orders." />

      <AdminErrorBanner message={error} onRetry={load} />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              statusFilter === s
                ? 'bg-[#f4e8db] text-ink font-medium'
                : 'border border-[#e8d5c0] text-muted hover:text-ink'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <AdminDataTable
        columns={columns}
        loading={loading}
        emptyMessage={statusFilter === 'All' ? 'No orders yet.' : `No orders with status "${statusFilter}".`}
      >
        {filtered.map((o) => (
          <tr
            key={o.id}
            className="border-b border-[#f0e6d6] last:border-0 cursor-pointer hover:bg-[#faf7f2]"
            onClick={() => navigate(`/admin/orders/${encodeURIComponent(o.id)}`)}
          >
            <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
            <td className="px-4 py-3">
              <p className="text-ink">{o.customerName || '—'}</p>
              <p className="text-xs text-muted">{o.customerEmail || ''}</p>
            </td>
            <td className="px-4 py-3">{formatPrice(o.total)}</td>
            <td className="px-4 py-3">
              <AdminStatusBadge status={o.status} />
            </td>
            <td className="px-4 py-3 text-muted">{o.date || '—'}</td>
          </tr>
        ))}
      </AdminDataTable>
    </div>
  )
}

export default AdminOrders
