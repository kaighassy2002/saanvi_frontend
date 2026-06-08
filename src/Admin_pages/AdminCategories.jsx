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
import CatalogCategoriesEditor from './components/CatalogCategoriesEditor'

function AdminCategories() {
  const { authFetch } = useAdminAuth()
  const { toast } = useAdminToast()
  const [mode, setMode] = useState('rich')
  const [richRows, setRichRows] = useState([])
  const [simpleRows, setSimpleRows] = useState([])
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

  const handleCreate = async (body) => {
    setSaving(true)
    try {
      await createCatalogCategory(authFetch, body)
      toast('Category created.')
      await load()
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id, body) => {
    setSaving(true)
    try {
      await updateCatalogCategory(authFetch, id, body)
      toast('Category updated.')
      await load()
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
      throw err
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
        description="Catalog categories power the home page grid (with images). Shop filter names are used in product forms."
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
        <CatalogCategoriesEditor
          categories={richRows}
          authFetch={authFetch}
          saving={saving}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={setDeleteTarget}
        />
      ) : (
        <div className="lux-card p-5 space-y-3">
          <p className="text-xs text-muted">
            Legacy category names for product dropdowns. For home page images, use Catalog
            categories.
          </p>
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
          <button
            type="button"
            onClick={() => setSimpleRows((p) => [...p, { name: '' }])}
            className="text-sm text-muted underline"
          >
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
