import React, { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  createCollection,
  deleteCollection,
  listCollections,
  updateCollection,
} from './services/adminApi'
import { useAdminToast } from './shared/AdminToastProvider'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminConfirmDialog from './components/AdminConfirmDialog'

const emptyForm = () => ({
  name: '',
  slug: '',
  description: '',
  heroImage: '',
  published: true,
  productIds: '',
})

function AdminCollections() {
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
      setRows(await listCollections(authFetch))
    } catch (e) {
      setError(e?.message || 'Failed to load collections')
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
      name: row.name || '',
      slug: row.slug || '',
      description: row.description || '',
      heroImage: row.heroImage || '',
      published: row.published !== false,
      productIds: (row.productIds || []).join(', '),
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        heroImage: form.heroImage.trim(),
        published: form.published,
        productIds: form.productIds
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      }
      if (editId) {
        await updateCollection(authFetch, editId, body)
        toast('Collection updated.')
      } else {
        await createCollection(authFetch, body)
        toast('Collection created.')
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
      await deleteCollection(authFetch, deleteTarget.id)
      setDeleteTarget(null)
      toast('Collection deleted.')
      await load()
    } catch (e) {
      toast(e?.message || 'Delete failed', 'error')
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title="Collections" description="Curated product sets for campaigns and storefront pages." />

      <AdminErrorBanner message={error} onRetry={load} />

      <form onSubmit={handleSave} className="lux-card p-5 mb-6 space-y-3">
        <h2 className="font-playfair text-sm text-ink">{editId ? 'Edit collection' : 'New collection'}</h2>
        <input className={inputClass} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className={inputClass} placeholder="Slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <textarea className={inputClass} rows={2} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className={inputClass} placeholder="Hero image URL" value={form.heroImage} onChange={(e) => setForm({ ...form, heroImage: e.target.value })} />
        <input className={inputClass} placeholder="Product IDs (comma-separated)" value={form.productIds} onChange={(e) => setForm({ ...form, productIds: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
          Published
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="lux-button px-4 py-2 text-sm">
            {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
          </button>
          {editId ? (
            <button type="button" onClick={() => { setEditId(null); setForm(emptyForm()) }} className="text-sm text-muted underline">
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="lux-card p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{row.name}</p>
                <p className="text-xs text-muted">{row.slug} · {(row.productIds || []).length} products</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(row)} className="rounded border border-[#d8c4a7] px-2 py-1 text-xs">
                  Edit
                </button>
                <button type="button" onClick={() => setDeleteTarget(row)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-700">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete collection"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default AdminCollections
