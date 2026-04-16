import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ORDERS_UPDATED_EVENT } from '../services/config'
import { adminFetchOrders } from '../services/orderService'

function csvEscape(value) {
  const s = String(value ?? '')
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const initialLoadRef = useRef(true)

  const load = useCallback(async () => {
    setError('')
    if (initialLoadRef.current) setLoading(true)
    else setRefreshing(true)
    try {
      const o = await adminFetchOrders()
      setOrders(o)
    } catch (e) {
      setError(e?.message || 'Failed to load orders')
    } finally {
      if (initialLoadRef.current) {
        initialLoadRef.current = false
        setLoading(false)
      }
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onOrders = () => load()
    window.addEventListener(ORDERS_UPDATED_EVENT, onOrders)
    return () => window.removeEventListener(ORDERS_UPDATED_EVENT, onOrders)
  }, [load])

  const filtered = useMemo(() => {
    const byStatus =
      statusFilter === 'all'
        ? orders
        : orders.filter((o) => o.status?.toLowerCase() === statusFilter.toLowerCase())
    const q = search.trim().toLowerCase()
    if (!q) return byStatus
    return byStatus.filter((o) => {
      const id = String(o.id || '').toLowerCase()
      const name = String(o.customerName || '').toLowerCase()
      const email = String(o.customerEmail || '').toLowerCase()
      return id.includes(q) || name.includes(q) || email.includes(q)
    })
  }, [orders, statusFilter, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, search, pageSize])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const summary = useMemo(() => {
    const totalValue = filtered.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    const delivered = filtered.filter((o) => o.status === 'Delivered').length
    const pending = filtered.filter((o) => o.status === 'Processing' || o.status === 'In Transit').length
    return {
      count: filtered.length,
      totalValue,
      delivered,
      pending,
    }
  }, [filtered])

  function exportCsv() {
    if (filtered.length === 0) return
    const header = ['Order ID', 'Date', 'Status', 'Customer Name', 'Customer Email', 'Total']
    const rows = filtered.map((o) => [
      o.id,
      o.date,
      o.status,
      o.customerName || '',
      o.customerEmail || '',
      Number(o.total) || 0,
    ])
    const csv = [header, ...rows].map((line) => line.map(csvEscape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'admin-orders.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (loading) return <p className="font-playfair text-muted">Loading orders…</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-bodoni text-3xl text-ink">Orders</h2>
          <p className="font-playfair text-sm text-muted">Fulfilment and status workflow</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="rounded-full border border-[#d6c0a2] bg-white px-4 py-2 font-playfair text-sm text-ink hover:border-[#7a2c3a] disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            disabled={refreshing}
            onClick={() => load()}
            className="rounded-full border border-[#d6c0a2] bg-white px-4 py-2 font-playfair text-sm text-ink hover:border-[#7a2c3a] disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-2 font-playfair text-sm text-red-800">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full flex-1 sm:min-w-[200px] sm:max-w-md">
          <label className="form-label" htmlFor="admin-order-search">
            Search
          </label>
          <input
            id="admin-order-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order ID, customer name, or email"
            className="royal-input w-full"
          />
        </div>
        <div className="w-full sm:min-w-[130px] sm:w-auto">
          <label className="form-label" htmlFor="admin-order-page-size">
            Per page
          </label>
          <select
            id="admin-order-page-size"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="royal-input w-full"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'Processing', 'In Transit', 'Delivered', 'Cancelled'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 font-playfair text-sm transition ${
              statusFilter === s
                ? 'bg-gold text-ink'
                : 'border border-[#d6c0a2] bg-white text-muted hover:border-[#7a2c3a]'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="lux-card p-4">
          <p className="text-overline text-xs">Filtered orders</p>
          <p className="mt-1 font-bodoni text-2xl text-ink">{summary.count}</p>
        </div>
        <div className="lux-card p-4">
          <p className="text-overline text-xs">Filtered value</p>
          <p className="mt-1 font-bodoni text-2xl text-ink">₹{summary.totalValue.toLocaleString()}</p>
        </div>
        <div className="lux-card p-4">
          <p className="text-overline text-xs">Delivered</p>
          <p className="mt-1 font-bodoni text-2xl text-ink">{summary.delivered}</p>
        </div>
        <div className="lux-card p-4">
          <p className="text-overline text-xs">Pending fulfilment</p>
          <p className="mt-1 font-bodoni text-2xl text-[#7a2c3a]">{summary.pending}</p>
        </div>
      </div>

      <div className="lux-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left font-playfair text-sm">
            <thead className="bg-[#f8f1e6]/90 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((o) => (
                <tr key={o.id} className="border-t border-[#eadfc9]">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/orders/${encodeURIComponent(o.id)}`}
                      className="font-medium text-[#7a2c3a] hover:underline"
                    >
                      {o.id}
                    </Link>
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-muted">
                    {o.customerName || o.customerEmail || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted">{o.date}</td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3 text-right">₹{Number(o.total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 ? (
          <p className="py-12 text-center font-playfair text-muted">No orders yet.</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center font-playfair text-muted">No orders match this filter.</p>
        ) : null}
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-playfair text-sm text-muted">
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)}
            {' '}of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-[#d6c0a2] bg-white px-3 py-1.5 text-sm text-ink disabled:opacity-50"
            >
              Previous
            </button>
            <span className="font-playfair text-sm text-muted">
              Page {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="rounded-full border border-[#d6c0a2] bg-white px-3 py-1.5 text-sm text-ink disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
