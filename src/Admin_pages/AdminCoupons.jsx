import React, { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
} from './services/adminApi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminConfirmDialog from './components/AdminConfirmDialog'
import { useAdminToast } from './shared/AdminToastProvider'

const emptyForm = () => ({
  code: '',
  type: 'percent',
  value: '10',
  minOrder: '0',
  maxUses: '0',
  active: true,
  expiresAt: '',
})

function AdminCoupons() {
  const { authFetch } = useAdminAuth()
  const { toast } = useAdminToast()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setRows(await listCoupons(authFetch))
    } catch (e) {
      setError(e?.message || 'Failed to load coupons')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const startEdit = (row) => {
    setEditId(row.id)
    setForm({
      code: row.code || '',
      type: row.type || 'percent',
      value: String(row.value ?? 0),
      minOrder: String(row.minOrder ?? 0),
      maxUses: String(row.maxUses ?? 0),
      active: row.active !== false,
      expiresAt: row.expiresAt ? row.expiresAt.slice(0, 10) : '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        code: form.code.trim(),
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder),
        maxUses: Number(form.maxUses),
        active: form.active,
        expiresAt: form.expiresAt || null,
      }
      if (editId) {
        await updateCoupon(authFetch, editId, body)
        toast('Coupon updated.')
      } else {
        await createCoupon(authFetch, body)
        toast('Coupon created.')
      }
      setForm(emptyForm())
      setEditId(null)
      await load()
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCoupon(authFetch, deleteTarget.id)
      setDeleteTarget(null)
      toast('Coupon deleted.')
      await load()
    } catch (e) {
      toast(e?.message || 'Delete failed', 'error')
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title="Coupons" description="Festive campaigns and discount codes (India GST storefront)." />

      <AdminErrorBanner message={error} onRetry={load} />

      <form onSubmit={handleSubmit} className="lux-card p-5 mb-6 space-y-3">
        <h2 className="admin-section-title text-base">{editId ? 'Edit' : 'New'} coupon</h2>
        <input className={inputClass} placeholder="Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
        <div className="grid grid-cols-2 gap-3">
          <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed amount (₹)</option>
          </select>
          <input className={inputClass} type="number" min="0" placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} type="number" min="0" placeholder="Min order (₹)" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
          <input className={inputClass} type="number" min="0" placeholder="Max uses (0 = unlimited)" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
        </div>
        <input className={inputClass} type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Active
        </label>
        <button type="submit" disabled={saving} className="lux-button px-4 py-2 text-sm">
          {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
        </button>
      </form>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="lux-card p-4 flex justify-between items-center gap-4">
              <div>
                <p className="font-mono font-medium text-ink">{row.code}</p>
                <p className="text-xs text-muted">
                  {row.type === 'percent' ? `${row.value}%` : `₹${row.value}`} off · min ₹{row.minOrder}
                  {row.active === false ? ' · inactive' : ''}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => startEdit(row)} className="text-xs border border-[#d8c4a7] rounded px-2 py-1">
                  Edit
                </button>
                <button type="button" onClick={() => setDeleteTarget(row)} className="text-xs border border-red-200 text-red-700 rounded px-2 py-1">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete coupon"
        message={`Delete code "${deleteTarget?.code}"?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default AdminCoupons
