import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { downloadOrdersExport, listOrders } from './services/adminApi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminDataTable from './components/AdminDataTable'
import AdminPagination from './components/AdminPagination'
import AdminStatusBadge from './components/AdminStatusBadge'
import AdminErrorBanner from './components/AdminErrorBanner'
import { useAdminToast } from './shared/AdminToastProvider'

const FILTER_OPTIONS = ['All', 'Processing', 'Paid', 'Shipped', 'Delivered', 'Cancelled']

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function AdminOrders() {
  const { authFetch } = useAdminAuth()
  const navigate = useNavigate()
  const { toast } = useAdminToast()
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || 'All'

  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const result = await listOrders(authFetch, {
        page,
        limit: 20,
        q: search.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      })
      setItems(result.items)
      setTotal(result.total)
      setPages(result.pages)
    } catch (e) {
      setError(e?.message || 'Failed to load orders')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [authFetch, page, search, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const handleExport = async () => {
    try {
      const blob = await downloadOrdersExport()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'orders.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast('Orders exported.')
    } catch (e) {
      toast(e?.message || 'Export failed', 'error')
    }
  }

  const columns = [
    { key: 'id', label: 'Order ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date' },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description="View and fulfill customer orders."
        action={{ label: 'Export CSV', onClick: handleExport }}
      />

      <AdminErrorBanner message={error} onRetry={load} />

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search order ID, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm w-full max-w-xs"
        />
      </div>

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

      <div className="rounded-xl border border-[#e8d5c0] bg-white overflow-hidden">
        <AdminDataTable
          columns={columns}
          loading={loading}
          emptyMessage={statusFilter === 'All' ? 'No orders yet.' : `No orders with status "${statusFilter}".`}
        >
          {items.map((o) => (
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
        <AdminPagination page={page} pages={pages} total={total} onPageChange={setPage} />
      </div>
    </div>
  )
}

export default AdminOrders
