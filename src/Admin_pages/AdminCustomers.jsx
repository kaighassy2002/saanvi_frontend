import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { listUsers, patchUserDisabled } from './services/adminApi'
import AdminPagination from './components/AdminPagination'
import AdminPageHeader from './components/AdminPageHeader'
import AdminDataTable from './components/AdminDataTable'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminConfirmDialog from './components/AdminConfirmDialog'
import { useAdminToast } from './shared/AdminToastProvider'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
]

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
  const { toast } = useAdminToast()
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [disableTarget, setDisableTarget] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const result = await listUsers(authFetch, {
        page,
        limit: 20,
        q: debouncedQuery.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
      setUsers(result.items)
      setTotal(result.total)
      setPages(result.pages)
    } catch (err) {
      setError(err?.message || 'Failed to load customers')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [authFetch, page, debouncedQuery, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, statusFilter])

  const confirmToggleDisabled = async () => {
    const user = disableTarget
    if (!user?.id) return
    setBusyId(user.id)
    setError('')
    try {
      const updated = await patchUserDisabled(authFetch, user.id, !user.disabled)
      setUsers((prev) => prev.map((row) => (row.id === user.id ? { ...row, ...updated } : row)))
      toast(updated.disabled ? 'Customer disabled.' : 'Customer enabled.')
      setDisableTarget(null)
    } catch (err) {
      setError(err?.message || 'Could not update customer status')
    } finally {
      setBusyId('')
    }
  }

  const columns = [
    { key: 'customer', label: 'Customer' },
    { key: 'contact', label: 'Contact' },
    { key: 'tags', label: 'Tags' },
    { key: 'created', label: 'Joined' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ]

  const inputClass =
    'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description="Search accounts, review tags and notes, and control storefront access."
      />
      <AdminErrorBanner message={error} onRetry={load} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="rounded-lg border border-[#e8d5c0] bg-white px-4 py-2 text-sm">
          <span className="text-muted">Total matching</span>{' '}
          <span className="font-medium text-ink">{loading ? '…' : total}</span>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className={`${inputClass} max-w-md`}
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-full px-3 py-1 text-xs ${
                statusFilter === value
                  ? 'bg-[#f4e8db] font-medium text-ink'
                  : 'border border-[#e8d5c0] text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#e8d5c0] bg-white overflow-hidden">
        <AdminDataTable columns={columns} loading={loading} emptyMessage="No customers found.">
          {users.map((u) => {
            const label = String(u.name || `${u.firstName || ''} ${u.lastName || ''}`).trim() || '—'
            const isBusy = busyId === u.id
            const tags = Array.isArray(u.tags) ? u.tags.filter(Boolean) : []
            return (
              <tr
                key={u.id}
                className="border-b border-[#f0e6d6] last:border-0 cursor-pointer hover:bg-[#faf7f2]"
                onClick={() => navigate(`/admin/customers/${u.id}`)}
              >
                <td className="px-4 py-3">
                  <p className="text-ink">{label}</p>
                  <p className="text-xs text-muted">
                    {u.googleId ? 'Google sign-in' : 'Email account'}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink">{u.email || '—'}</p>
                  <p className="text-xs text-muted">{u.phone || 'No phone'}</p>
                </td>
                <td className="px-4 py-3">
                  {tags.length ? (
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#f4e8db] px-2 py-0.5 text-[10px] text-ink"
                        >
                          {tag}
                        </span>
                      ))}
                      {tags.length > 2 ? (
                        <span className="text-[10px] text-muted">+{tags.length - 2}</span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
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
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/admin/customers/${u.id}`)
                      }}
                      className="rounded-lg border border-[#e8d5c0] px-3 py-1.5 text-xs text-ink hover:bg-[#faf7f2]"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDisableTarget(u)
                      }}
                      disabled={isBusy}
                      className="rounded-lg border border-[#e8d5c0] px-3 py-1.5 text-xs text-ink hover:bg-[#faf7f2] disabled:opacity-60"
                    >
                      {isBusy ? 'Saving…' : u.disabled ? 'Enable' : 'Disable'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </AdminDataTable>
        <AdminPagination page={page} pages={pages} total={total} onPageChange={setPage} />
      </div>

      <AdminConfirmDialog
        open={!!disableTarget}
        title={disableTarget?.disabled ? 'Enable customer' : 'Disable customer'}
        message={
          disableTarget?.disabled
            ? `Re-enable access for ${disableTarget?.email || 'this customer'}?`
            : `Disable ${disableTarget?.email || 'this customer'}? They will not be able to sign in or checkout.`
        }
        confirmLabel={disableTarget?.disabled ? 'Enable' : 'Disable'}
        onConfirm={confirmToggleDisabled}
        onCancel={() => setDisableTarget(null)}
      />
    </div>
  )
}

export default AdminCustomers
