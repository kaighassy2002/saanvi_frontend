import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { getUser, patchUser } from './services/adminApi'
import { useAdminToast } from './shared/AdminToastProvider'
import AdminBreadcrumbs from './components/AdminBreadcrumbs'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminDataTable from './components/AdminDataTable'
import AdminStatusBadge from './components/AdminStatusBadge'
import AdminConfirmDialog from './components/AdminConfirmDialog'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function formatDate(value) {
  const iso = String(value || '').trim()
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
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
  const [confirmDisable, setConfirmDisable] = useState(false)

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

  const orderStats = useMemo(() => {
    const totalSpend = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
    const lastOrder = orders[0]
    return { totalSpend, lastOrderDate: lastOrder?.date || lastOrder?.createdAt || '' }
  }, [orders])

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
      setConfirmDisable(false)
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

  const tagList = Array.isArray(user.tags) ? user.tags.filter(Boolean) : []
  const addresses = Array.isArray(user.addresses) ? user.addresses : []

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
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="admin-page-title">{name}</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                user.disabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {user.disabled ? 'Disabled' : 'Active'}
            </span>
          </div>
          <p className="admin-page-lead">{user.email}</p>
          {user.phone ? <p className="admin-body-sm">{user.phone}</p> : null}
          {tagList.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#f4e8db] px-2.5 py-0.5 text-xs text-ink"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmDisable(true)}
            className="rounded-lg border border-[#d8c4a7] px-3 py-2 text-sm hover:bg-[#f7ecee]"
          >
            {user.disabled ? 'Enable account' : 'Disable account'}
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <section className="lux-card p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Orders</p>
          <p className="admin-metric mt-1 text-2xl">{orders.length}</p>
        </section>
        <section className="lux-card p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Lifetime spend</p>
          <p className="admin-metric mt-1 text-2xl">{formatPrice(orderStats.totalSpend)}</p>
        </section>
        <section className="lux-card p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Last order</p>
          <p className="mt-1 text-sm text-ink">{formatDate(orderStats.lastOrderDate)}</p>
        </section>
        <section className="lux-card p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Joined</p>
          <p className="mt-1 text-sm text-ink">{formatDate(user.createdAt)}</p>
        </section>
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

        <section className="lux-card p-5 space-y-3">
          <h2 className="admin-section-title text-base">Account</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Sign-in</dt>
              <dd className="text-ink">{user.googleId ? 'Google' : 'Email & password'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Customer ID</dt>
              <dd className="font-mono text-xs text-ink">{user.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Saved addresses</dt>
              <dd className="text-ink">{addresses.length}</dd>
            </div>
          </dl>
          {addresses.length ? (
            <ul className="space-y-2 border-t border-[#f0e6d6] pt-3">
              {addresses.map((addr) => (
                <li key={addr.id} className="rounded-lg bg-[#faf7f2] p-3 text-xs">
                  <p className="font-medium text-ink">
                    {[addr.firstName, addr.lastName].filter(Boolean).join(' ') || addr.label || 'Address'}
                  </p>
                  <p className="mt-1 text-muted">
                    {[addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                  </p>
                  {addr.phone ? <p className="mt-1 text-muted">{addr.phone}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted border-t border-[#f0e6d6] pt-3">No saved addresses.</p>
          )}
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
            <td className="px-4 py-3 text-muted">{formatDate(o.date || o.createdAt)}</td>
            <td className="px-4 py-3">{formatPrice(o.total)}</td>
            <td className="px-4 py-3">
              <AdminStatusBadge status={o.status} />
            </td>
          </tr>
        ))}
      </AdminDataTable>

      <AdminConfirmDialog
        open={confirmDisable}
        title={user.disabled ? 'Enable customer' : 'Disable customer'}
        message={
          user.disabled
            ? `Re-enable access for ${user.email}?`
            : `Disable ${user.email}? They will not be able to sign in or checkout.`
        }
        confirmLabel={user.disabled ? 'Enable' : 'Disable'}
        onConfirm={toggleDisabled}
        onCancel={() => setConfirmDisable(false)}
      />
    </div>
  )
}

export default AdminCustomerDetail
