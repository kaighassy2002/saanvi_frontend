import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { getUser, patchUser } from './services/adminApi'
import { useAdminToast } from './shared/AdminToastProvider'
import AdminBreadcrumbs from './components/AdminBreadcrumbs'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminDataTable from './components/AdminDataTable'
import AdminStatusBadge from './components/AdminStatusBadge'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function AdminCustomerDetail() {
  const { id } = useParams()
  const { authFetch } = useAdminAuth()
  const navigate = useNavigate()
  const { toast } = useAdminToast()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const data = await getUser(authFetch, id)
      setUser(data.user)
      setOrders(data.orders || [])
      setNotes(data.user?.adminNotes || '')
      setTags(Array.isArray(data.user?.tags) ? data.user.tags.join(', ') : '')
    } catch (e) {
      setError(e?.message || 'Failed to load customer')
    } finally {
      setLoading(false)
    }
  }, [authFetch, id])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await patchUser(authFetch, id, {
        adminNotes: notes,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      setUser(updated)
      toast('Customer notes saved.')
    } catch (e) {
      toast(e?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleDisabled = async () => {
    try {
      const updated = await patchUser(authFetch, id, { disabled: !user.disabled })
      setUser(updated)
      toast(updated.disabled ? 'Customer disabled.' : 'Customer enabled.')
    } catch (e) {
      toast(e?.message || 'Update failed', 'error')
    }
  }

  if (loading) return <p className="text-muted text-sm">Loading…</p>
  if (!user) {
    return (
      <div>
        <Link to="/admin/customers" className="text-sm text-muted hover:text-ink">
          ← Customers
        </Link>
        <p className="mt-4 text-muted">Customer not found.</p>
      </div>
    )
  }

  const name =
    user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email

  const orderColumns = [
    { key: 'id', label: 'Order' },
    { key: 'date', label: 'Date' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
  ]

  const inputClass =
    'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

  return (
    <div className="max-w-4xl">
      <AdminBreadcrumbs
        items={[
          { label: 'Customers', to: '/admin/customers' },
          { label: name },
        ]}
      />

      <AdminErrorBanner message={error} onRetry={load} />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="admin-page-title">{name}</h1>
          <p className="admin-page-lead">{user.email}</p>
          {user.phone ? <p className="admin-body-sm">{user.phone}</p> : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleDisabled}
            className="rounded-lg border border-[#d8c4a7] px-3 py-2 text-sm hover:bg-[#f7ecee]"
          >
            {user.disabled ? 'Enable account' : 'Disable account'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <section className="lux-card p-5 space-y-3">
          <h2 className="admin-section-title text-base">Admin notes</h2>
          <textarea
            rows={4}
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VIP, sizing requests, etc."
          />
          <label className="block text-xs text-muted">Tags (comma-separated)</label>
          <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} />
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="lux-button px-4 py-2 text-sm disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save notes'}
          </button>
        </section>
        <section className="lux-card p-5">
          <p className="text-xs text-muted uppercase tracking-wide">Order history</p>
          <p className="admin-metric mt-2 text-3xl">{orders.length}</p>
          <p className="text-sm text-muted">orders placed</p>
        </section>
      </div>

      <h2 className="admin-section-title mb-3">Orders</h2>
      <AdminDataTable columns={orderColumns} loading={false} emptyMessage="No orders for this customer.">
        {orders.map((o) => (
          <tr
            key={o.id}
            className="border-b border-[#f0e6d6] last:border-0 cursor-pointer hover:bg-[#faf7f2]"
            onClick={() => navigate(`/admin/orders/${encodeURIComponent(o.id)}`)}
          >
            <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
            <td className="px-4 py-3 text-muted">{o.date || '—'}</td>
            <td className="px-4 py-3">{formatPrice(o.total)}</td>
            <td className="px-4 py-3">
              <AdminStatusBadge status={o.status} />
            </td>
          </tr>
        ))}
      </AdminDataTable>
    </div>
  )
}

export default AdminCustomerDetail
