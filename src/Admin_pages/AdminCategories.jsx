import React, { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  createCatalogCategory,
  deleteCatalogCategory,
  getCategories,
  listCatalogCategories,
  putCategories,
  updateCatalogCategory,
} from './services/adminApi'
import { useAdminToast } from './shared/AdminToastProvider'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminConfirmDialog from './components/AdminConfirmDialog'

const emptyField = () => ({ key: '', label: '', type: 'text', options: '', required: false })

const emptyRich = () => ({
  name: '',
  slug: '',
  description: '',
  image: '',
  sortOrder: '0',
  seoTitle: '',
  seoDescription: '',
  fieldDefinitions: [],
})

function AdminCategories() {
  const { authFetch } = useAdminAuth()
  const { toast } = useAdminToast()
  const [mode, setMode] = useState('rich')
  const [richRows, setRichRows] = useState([])
  const [simpleRows, setSimpleRows] = useState([])
  const [form, setForm] = useState(emptyRich())
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [rich, simple] = await Promise.all([
        listCatalogCategories(authFetch),
        getCategories(authFetch),
      ])
      setRichRows(rich)
      setSimpleRows(simple.length ? simple.map((name) => ({ name: String(name) })) : [{ name: '' }])
    } catch (e) {
      setError(e?.message || 'Failed to load categories')
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
      image: row.image || '',
      sortOrder: String(row.sortOrder ?? 0),
      seoTitle: row.seoTitle || '',
      seoDescription: row.seoDescription || '',
      fieldDefinitions: Array.isArray(row.fieldDefinitions)
        ? row.fieldDefinitions.map((f) => ({
            key: f.key || '',
            label: f.label || '',
            type: f.type || 'text',
            options: Array.isArray(f.options) ? f.options.join(', ') : '',
            required: !!f.required,
          }))
        : [],
    })
  }

  const saveRich = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        seoTitle: form.seoTitle.trim(),
        seoDescription: form.seoDescription.trim(),
        fieldDefinitions: (form.fieldDefinitions || [])
          .map((f) => ({
            key: String(f.key || '').trim(),
            label: String(f.label || '').trim(),
            type: f.type || 'text',
            options: String(f.options || '')
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean),
            required: !!f.required,
          }))
          .filter((f) => f.key),
      }
      if (editId) {
        await updateCatalogCategory(authFetch, editId, body)
        toast('Category updated.')
      } else {
        await createCatalogCategory(authFetch, body)
        toast('Category created.')
      }
      setForm(emptyRich())
      setEditId(null)
      await load()
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveSimple = async () => {
    const categories = [...new Set(simpleRows.map((r) => r.name.trim()).filter(Boolean))]
    if (!categories.length) {
      setError('Add at least one category.')
      return
    }
    setSaving(true)
    try {
      await putCategories(authFetch, categories)
      toast('Shop categories saved.')
      await load()
    } catch (e) {
      toast(e?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCatalogCategory(authFetch, deleteTarget.id)
      setDeleteTarget(null)
      toast('Category deleted.')
      await load()
    } catch (e) {
      toast(e?.message || 'Delete failed', 'error')
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="Categories"
        description="Rich categories with images and SEO, plus legacy shop category names for product forms."
      />

      <AdminErrorBanner message={error} onRetry={load} />

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode('rich')}
          className={`rounded-full px-3 py-1 text-xs ${mode === 'rich' ? 'bg-[#f4e8db] font-medium' : 'border border-[#e8d5c0]'}`}
        >
          Catalog categories
        </button>
        <button
          type="button"
          onClick={() => setMode('simple')}
          className={`rounded-full px-3 py-1 text-xs ${mode === 'simple' ? 'bg-[#f4e8db] font-medium' : 'border border-[#e8d5c0]'}`}
        >
          Shop filter names
        </button>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : mode === 'rich' ? (
        <>
          <form onSubmit={saveRich} className="lux-card p-5 mb-6 space-y-3">
            <h2 className="font-playfair text-sm">{editId ? 'Edit' : 'New'} category</h2>
            <input className={inputClass} placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className={inputClass} placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <input className={inputClass} placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <textarea className={inputClass} rows={2} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="border-t border-[#f0e6d6] pt-3 space-y-2">
              <p className="text-xs font-medium text-muted">Custom fields (P2 — category-specific product attributes)</p>
              {(form.fieldDefinitions || []).map((f, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 p-2 rounded bg-[#faf7f2]">
                  <input className={inputClass} placeholder="key" value={f.key} onChange={(e) => {
                    const next = [...form.fieldDefinitions]
                    next[i] = { ...next[i], key: e.target.value }
                    setForm({ ...form, fieldDefinitions: next })
                  }} />
                  <input className={inputClass} placeholder="Label" value={f.label} onChange={(e) => {
                    const next = [...form.fieldDefinitions]
                    next[i] = { ...next[i], label: e.target.value }
                    setForm({ ...form, fieldDefinitions: next })
                  }} />
                  <select className={inputClass} value={f.type} onChange={(e) => {
                    const next = [...form.fieldDefinitions]
                    next[i] = { ...next[i], type: e.target.value }
                    setForm({ ...form, fieldDefinitions: next })
                  }}>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="select">Select</option>
                  </select>
                  <input className={inputClass} placeholder="Options (comma)" value={f.options} onChange={(e) => {
                    const next = [...form.fieldDefinitions]
                    next[i] = { ...next[i], options: e.target.value }
                    setForm({ ...form, fieldDefinitions: next })
                  }} />
                  <label className="col-span-2 flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={f.required} onChange={(e) => {
                      const next = [...form.fieldDefinitions]
                      next[i] = { ...next[i], required: e.target.checked }
                      setForm({ ...form, fieldDefinitions: next })
                    }} />
                    Required
                  </label>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm({ ...form, fieldDefinitions: [...(form.fieldDefinitions || []), emptyField()] })}
                className="text-xs text-muted underline"
              >
                + Add field
              </button>
            </div>
            <button type="submit" disabled={saving} className="lux-button px-4 py-2 text-sm">
              {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
            </button>
          </form>
          <ul className="space-y-2">
            {richRows.map((row) => (
              <li key={row.id} className="lux-card p-4 flex gap-4 items-start">
                {row.image ? (
                  <img src={row.image} alt="" className="h-14 w-14 rounded object-cover shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded bg-[#f4e8db] shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink">{row.name}</p>
                  <p className="text-xs text-muted truncate">{row.slug}</p>
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
        </>
      ) : (
        <div className="lux-card p-5 space-y-3">
          {simpleRows.map((row, index) => (
            <input
              key={index}
              className={inputClass}
              value={row.name}
              onChange={(e) =>
                setSimpleRows((prev) => prev.map((r, i) => (i === index ? { name: e.target.value } : r)))
              }
              placeholder="Category name"
            />
          ))}
          <button type="button" onClick={() => setSimpleRows((p) => [...p, { name: '' }])} className="text-sm text-muted underline">
            + Add row
          </button>
          <button type="button" disabled={saving} onClick={saveSimple} className="lux-button px-4 py-2 text-sm block">
            {saving ? 'Saving…' : 'Save shop categories'}
          </button>
        </div>
      )}

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete category"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default AdminCategories
