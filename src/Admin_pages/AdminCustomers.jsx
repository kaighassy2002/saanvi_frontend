import React, { useMemo, useEffect, useState } from 'react'
import { adminFetchCustomers, adminSetCustomerDisabled } from '../services/customerService'

function csvEscape(value) {
  const s = String(value ?? '')
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  async function load() {
    setError('')
    try {
      const list = await adminFetchCustomers()
      setCustomers(list)
    } catch (e) {
      setError(e?.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleDisabled(c) {
    setBusy(c.id)
    try {
      await adminSetCustomerDisabled(c.id, !c.disabled)
      await load()
    } catch (e) {
      setError(e?.message || 'Update failed')
    } finally {
      setBusy(null)
    }
  }

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customers.filter((c) => {
      if (statusFilter === 'active' && c.disabled) return false
      if (statusFilter === 'disabled' && !c.disabled) return false
      if (!q) return true
      const name = String(c.name || '').toLowerCase()
      const email = String(c.email || '').toLowerCase()
      const phone = String(c.phone || '').toLowerCase()
      return name.includes(q) || email.includes(q) || phone.includes(q)
    })
  }, [customers, search, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCustomers.slice(start, start + pageSize)
  }, [filteredCustomers, currentPage, pageSize])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, pageSize])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  function exportCsv() {
    if (filteredCustomers.length === 0) return
    const header = ['Name', 'Email', 'Phone', 'Joined', 'Disabled']
    const rows = filteredCustomers.map((c) => [
      c.name || '',
      c.email || '',
      c.phone || '',
      c.createdAt || '',
      c.disabled ? 'Yes' : 'No',
    ])
    const csv = [header, ...rows].map((line) => line.map(csvEscape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'admin-customers.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (loading) return <p className="font-playfair text-muted">Loading customers…</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bodoni text-3xl text-ink">Customers</h2>
        <p className="font-playfair text-sm text-muted">Read-only profiles with light account controls</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full flex-1 sm:min-w-[220px]">
          <label className="form-label" htmlFor="admin-customer-search">
            Search
          </label>
          <input
            id="admin-customer-search"
            type="search"
            className="royal-input w-full"
            placeholder="Name, email, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:min-w-[160px] sm:w-auto">
          <label className="form-label" htmlFor="admin-customer-status">
            Status
          </label>
          <select
            id="admin-customer-status"
            className="royal-input w-full"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <div className="w-full sm:min-w-[130px] sm:w-auto">
          <label className="form-label" htmlFor="admin-customer-page-size">
            Per page
          </label>
          <select
            id="admin-customer-page-size"
            className="royal-input w-full"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filteredCustomers.length === 0}
          className="rounded-full border border-[#d6c0a2] bg-white px-4 py-2 font-playfair text-sm text-ink hover:border-[#7a2c3a] disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-2 font-playfair text-sm text-red-800">{error}</p>
      ) : null}

      <div className="lux-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left font-playfair text-sm">
            <thead className="bg-[#f8f1e6]/90 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Account</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((c) => (
                <tr key={c.id} className="border-t border-[#eadfc9]">
                  <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.email}</td>
                  <td className="px-4 py-3 text-muted">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-muted">{c.createdAt || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {c.disabled ? (
                      <span className="mr-2 text-xs text-red-700">Disabled</span>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy === c.id}
                      onClick={() => toggleDisabled(c)}
                      className="text-[#7a2c3a] hover:underline disabled:opacity-50"
                    >
                      {c.disabled ? 'Enable' : 'Disable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customers.length === 0 ? (
          <p className="py-12 text-center font-playfair text-muted">No customers.</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="py-12 text-center font-playfair text-muted">No customers match this filter.</p>
        ) : null}
      </div>

      {filteredCustomers.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-playfair text-sm text-muted">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, filteredCustomers.length)} of {filteredCustomers.length}
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
