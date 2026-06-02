import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { listUsers, patchUserDisabled } from './services/adminApi'
import AdminPagination from './components/AdminPagination'
import AdminPageHeader from './components/AdminPageHeader'
import AdminDataTable from './components/AdminDataTable'
import AdminErrorBanner from './components/AdminErrorBanner'

function formatCreatedAt(value) {
  const iso = String(value || '').trim()
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function AdminCustomers() {
  const { authFetch } = useAdminAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const result = await listUsers(authFetch, { page, limit: 20, q: query.trim() || undefined })
      setUsers(result.items)
      setTotal(result.total)
      setPages(result.pages)
    } catch (err) {
      setError(err?.message || 'Failed to load customers')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [authFetch, page, query])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [query])

  const toggleDisabled = async (user) => {
    if (!user?.id) return
    setBusyId(user.id)
    setError('')
    try {
      const updated = await patchUserDisabled(authFetch, user.id, !user.disabled)
      setUsers((prev) => prev.map((row) => (row.id === user.id ? { ...row, ...updated } : row)))
    } catch (err) {
      setError(err?.message || 'Could not update customer status')
    } finally {
      setBusyId('')
    }
  }

  const columns = [
    { key: 'customer', label: 'Customer' },
    { key: 'contact', label: 'Contact' },
    { key: 'created', label: 'Created' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ]

  return (
    <div>
      <AdminPageHeader title="Customers" description="Manage customer accounts and access status." />
      <AdminErrorBanner message={error} onRetry={load} />

      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="w-full max-w-md rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-[#e8d5c0] bg-white overflow-hidden">
      <AdminDataTable columns={columns} loading={loading} emptyMessage="No customers found.">
        {users.map((u) => {
          const label = String(u.name || `${u.firstName || ''} ${u.lastName || ''}`).trim() || '—'
          const isBusy = busyId === u.id
          return (
            <tr
              key={u.id}
              className="border-b border-[#f0e6d6] last:border-0 cursor-pointer hover:bg-[#faf7f2]"
              onClick={() => navigate(`/admin/customers/${u.id}`)}
            >
              <td className="px-4 py-3">
                <p className="text-ink">{label}</p>
                <p className="text-xs text-muted font-mono">{u.id}</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-ink">{u.email || '—'}</p>
                <p className="text-xs text-muted">{u.phone || 'No phone'}</p>
              </td>
              <td className="px-4 py-3 text-muted">{formatCreatedAt(u.createdAt)}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    u.disabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {u.disabled ? 'Disabled' : 'Active'}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleDisabled(u)
                  }}
                  disabled={isBusy}
                  className="rounded-lg border border-[#e8d5c0] px-3 py-1.5 text-xs text-ink hover:bg-[#faf7f2] disabled:opacity-60"
                >
                  {isBusy ? 'Saving…' : u.disabled ? 'Enable' : 'Disable'}
                </button>
              </td>
            </tr>
          )
        })}
      </AdminDataTable>
      <AdminPagination page={page} pages={pages} total={total} onPageChange={setPage} />
      </div>
    </div>
  )
}

export default AdminCustomers
